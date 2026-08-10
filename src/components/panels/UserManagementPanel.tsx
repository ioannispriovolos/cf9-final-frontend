import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowLeftToLine,
    ArrowRightToLine,
    DatabaseSearch,
    UserPlus,
    UserRoundPen,
    UserRoundX,
} from "lucide-react";

import {
    type SubmitHandler,
    useForm,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
    createUser,
    deleteUser,
    getUserByUuid,
    getUsersPaginated,
    updateUser,
} from "@/api/users";

import {
    createUserFormSchema,
    deleteUserSchema,
    ROLE_TO_ID_MAP,
    searchUserSchema,
    updateUserSchema,
    type CreateUserFormData,
    type DeleteUserPayload,
    type SearchUserPayload,
    type UpdateUserPayload,
    type User,
} from "@/schemas/users";

/**
 * Represents the available subviews of the user management console.
 *
 * Each value corresponds to one functional area of the component:
 * viewing/searching users, creating users, modifying users, or
 * soft-deleting users.
 */
type UserSubView =
    | "view"
    | "create"
    | "modify"
    | "delete";

/**
 * Number of users requested from the backend per page.
 */
const PAGE_SIZE = 5;

/**
 * Default sorting applied to paginated user retrieval.
 *
 * Users are ordered alphabetically by username in ascending order.
 */
const DEFAULT_SORT = "username,asc";

/**
 * Initial values used by the create-user form.
 *
 * The VIEWER role is selected by default to provide the least privileged
 * role as the initial form option.
 */
const CREATE_USER_DEFAULTS: CreateUserFormData = {
    username: "",
    password: "",
    confirmPassword: "",
    role: "VIEWER",
};

/**
 * Initial values used by the update-user form.
 *
 * A null role indicates that the user's currently assigned role should
 * remain unchanged unless the administrator explicitly selects another role.
 */
const UPDATE_USER_DEFAULTS: UpdateUserPayload = {
    uuid: "",
    username: "",
    role: null,
};

/**
 * Initial values used by the soft-delete user form.
 */
const DELETE_USER_DEFAULTS: DeleteUserPayload = {
    uuid: "",
};

/**
 * Initial values used by the single-user search form.
 */
const SEARCH_USER_DEFAULTS: SearchUserPayload = {
    uuid: "",
};

/**
 * Converts an unknown caught value into a user-facing error message.
 *
 * If the caught value is an Error instance, its message is returned.
 * Otherwise, the supplied fallback message is used.
 *
 * @param error - The unknown value caught during an operation.
 * @param fallbackMessage - Message to return when the caught value is not
 * an Error instance.
 *
 * @returns A safe error message suitable for display to the user.
 */
function getErrorMessage(
    error: unknown,
    fallbackMessage: string
): string {
    return error instanceof Error
        ? error.message
        : fallbackMessage;
}

/**
 * User management console used by administrators to search, create,
 * modify, and soft-delete user accounts.
 *
 * The component coordinates:
 * - paginated directory retrieval;
 * - UUID-based user lookup;
 * - create-user validation and submission;
 * - update-user validation and submission;
 * - soft-deletion with user confirmation;
 * - loading, error, and pagination state;
 * - role and password validation feedback.
 *
 * API communication is delegated to the functions provided by `api/users.ts`,
 * while form validation is handled through React Hook Form and the Zod
 * schemas defined in `schemas/users.ts`.
 *
 * @returns The user management interface.
 */
export default function UserManagementPanel() {

    /**
     * Tracks which user-management subview is currently visible.
     */
    const [
        activeSubView,
        setActiveSubView,
    ] = useState<UserSubView>("view");

    /**
     * Stores the users currently displayed in the directory table.
     *
     * Depending on the active operation, this may contain either a paginated
     * collection of users or a single UUID search result.
     */
    const [users, setUsers] =
        useState<User[]>([]);

    /**
     * Indicates whether user directory data is currently being retrieved.
     */
    const [
        isLoadingUsers,
        setIsLoadingUsers,
    ] = useState(false);

    /**
     * Stores the most recent directory/search error for inline display.
     */
    const [
        errorMessage,
        setErrorMessage,
    ] = useState<string | null>(null);

    /**
     * Zero-based index of the currently displayed user directory page.
     */
    const [
        currentPage,
        setCurrentPage,
    ] = useState(0);

    /**
     * Total number of available backend pages.
     */
    const [
        totalPages,
        setTotalPages,
    ] = useState(1);

    /**
     * Total number of active user records reported by the backend.
     */
    const [
        totalElements,
        setTotalElements,
    ] = useState(0);

    /**
     * Configures the UUID-based search form.
     *
     * Validation is performed on every field change using `searchUserSchema`,
     * allowing the search button to be enabled only after a valid UUID is entered.
     */
    const {
        register: registerSearch,
        handleSubmit: handleSubmitSearch,
        reset: resetSearch,

        formState: {
            errors: searchErrors,
            isSubmitting: isSearching,
            isValid: isSearchValid,
        },
    } = useForm<SearchUserPayload>({
        resolver: zodResolver(
            searchUserSchema
        ),

        mode: "onChange",

        defaultValues:
        SEARCH_USER_DEFAULTS,
    });

    /**
     * Configures the create-user form.
     *
     * React Hook Form manages form state and submission while Zod validates
     * username rules, password complexity, password confirmation, and role values.
     *
     * `watchCreate` is used to provide immediate UI feedback for username length
     * and password-security requirements.
     */
    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        reset: resetCreate,
        watch: watchCreate,

        formState: {
            errors: createErrors,
            isSubmitting: isCreating,
            isValid: isCreateValid,
        },
    } = useForm<CreateUserFormData>({
        resolver: zodResolver(
            createUserFormSchema
        ),

        mode: "onChange",

        defaultValues:
        CREATE_USER_DEFAULTS,
    });

    /**
     * Configures the update-user form.
     *
     * The form validates the target UUID, required username, and optional role
     * override. A null role indicates that the current backend role should be kept.
     */
    const {
        register: registerUpdate,
        handleSubmit: handleSubmitUpdate,
        reset: resetUpdate,

        formState: {
            errors: updateErrors,
            isSubmitting: isUpdating,
            isValid: isUpdateValid,
        },
    } = useForm<UpdateUserPayload>({
        resolver: zodResolver(
            updateUserSchema
        ),

        mode: "onChange",

        defaultValues:
        UPDATE_USER_DEFAULTS,
    });

    /**
     * Configures the soft-delete form.
     *
     * UUID validation is performed while the user types so deletion cannot be
     * submitted until a valid target user identifier has been provided.
     */
    const {
        register: registerDelete,
        handleSubmit: handleSubmitDelete,
        reset: resetDelete,

        formState: {
            errors: deleteErrors,
            isSubmitting: isDeleting,
            isValid: isDeleteValid,
        },
    } = useForm<DeleteUserPayload>({
        resolver: zodResolver(
            deleteUserSchema
        ),

        mode: "onChange",

        defaultValues:
        DELETE_USER_DEFAULTS,
    });

    /**
     * Watches the create-user form fields that require immediate visual feedback.
     */
    const username =
        watchCreate("username") ?? "";

    const password =
        watchCreate("password") ?? "";

    const confirmPassword =
        watchCreate("confirmPassword") ?? "";

    /**
     * Evaluates individual password-complexity requirements for real-time
     * validation feedback in the create-user interface.
     *
     * The values are memoized and recalculated only when the password changes.
     */
    const passwordRequirements =
        useMemo(
            () => ({
                hasMinLength:
                    password.length >= 8,

                hasUppercase:
                    /[A-Z]/.test(password),

                hasLowercase:
                    /[a-z]/.test(password),

                hasNumber:
                    /[0-9]/.test(password),

                hasSpecial:
                    /[!@#$%^&+=]/.test(
                        password
                    ),
            }),
            [password]
        );

    const isPasswordValid =
        passwordRequirements.hasMinLength &&
        passwordRequirements.hasUppercase &&
        passwordRequirements.hasLowercase &&
        passwordRequirements.hasNumber &&
        passwordRequirements.hasSpecial;

    const isUsernameValid =
        username.trim().length >= 2 &&
        username.trim().length <= 20;

    const passwordsMatch =
        confirmPassword.length > 0 &&
        password === confirmPassword;

    /**
     * Loads one page of the active user directory from the backend.
     *
     * The function manages the directory loading indicator, clears any previous
     * error, retrieves the requested page, and updates the displayed records and
     * pagination metadata.
     *
     * @param page - Zero-based page index to retrieve.
     */
    const loadUsers = useCallback(
        async (page: number) => {
            setIsLoadingUsers(true);
            setErrorMessage(null);

            try {
                const data =
                    await getUsersPaginated(
                        page,
                        PAGE_SIZE,
                        DEFAULT_SORT
                    );

                setUsers(data.content);

                setTotalPages(
                    data.totalPages
                );

                setTotalElements(
                    data.totalElements
                );
            } catch (error) {
                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Failed to retrieve directory records."
                    )
                );
            } finally {
                setIsLoadingUsers(false);
            }
        },
        []
    );

    /**
     * Reloads the user directory whenever the user opens the directory subview
     * or changes pagination page.
     */
    useEffect(() => {
        if (activeSubView === "view") {
            void loadUsers(currentPage);
        }
    }, [
        activeSubView,
        currentPage,
        loadUsers,
    ]);

    /**
     * Retrieves one user by UUID and replaces the directory contents with the
     * matching user.
     *
     * Successful searches are represented as a single-record result set.
     * Failed searches clear the table and expose a readable lookup error.
     *
     * @param uuid - Validated UUID submitted through the search form.
     */
    const onSearchUser:
        SubmitHandler<SearchUserPayload> =
        async ({ uuid }) => {
            setIsLoadingUsers(true);
            setErrorMessage(null);

            try {
                const user =
                    await getUserByUuid(uuid);

                setUsers([user]);

                /*
                 * Search results are treated as
                 * a single-record result set.
                 */
                setTotalPages(1);
                setTotalElements(1);
            } catch (error) {
                setUsers([]);

                setTotalPages(1);
                setTotalElements(0);

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "User lookup failed."
                    )
                );
            } finally {
                setIsLoadingUsers(false);
            }
        };

    /**
     * Clears the current search criteria and reloads the current paginated
     * directory from the backend.
     */
    const handleSyncDirectory =
        async () => {
            resetSearch(
                SEARCH_USER_DEFAULTS
            );

            await loadUsers(currentPage);
        };

    /**
     * Creates a new user account using validated form data.
     *
     * The selected frontend role is translated into the numeric role identifier
     * expected by the backend. After successful creation, the form is reset and
     * the first directory page is refreshed because alphabetical sorting may place
     * the newly created user on a different page.
     *
     * @param formData - Validated create-user form values.
     */
    const onCreateUser:
        SubmitHandler<CreateUserFormData> =
        async ({
                   username,
                   password,
                   role,
               }) => {
            try {
                await createUser({
                    username,
                    password,

                    roleId:
                        ROLE_TO_ID_MAP[
                            role
                            ],
                });

                toast.success(
                    `Identity "${username}" successfully provisioned.`
                );

                resetCreate(
                    CREATE_USER_DEFAULTS
                );

                if (currentPage !== 0) {
                    setCurrentPage(0);
                } else {
                    await loadUsers(0);
                }
            } catch (error) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Identity provision rejected."
                    )
                );
            }
        };

    /**
     * Opens the modification subview for the selected user.
     *
     * The update form is pre-populated with the selected user's UUID and current
     * username. The role field is initialized to null so the existing role is
     * preserved unless an administrator explicitly chooses a replacement.
     *
     * @param user - User selected from the directory table.
     */
    const handleEditUser = (
        user: User
    ) => {
        resetUpdate({
            uuid: user.uuid,

            /*
             * Your backend requires username,
             * so populate the existing value.
             */
            username: user.username,

            /*
             * null means:
             * keep existing role.
             */
            role: null,
        });

        setActiveSubView("modify");
    };

    /**
     * Updates the selected user with validated update-form values.
     *
     * After a successful update, the update form is reset and the currently
     * displayed directory page is reloaded so the UI immediately reflects
     * backend changes.
     *
     * @param data - Validated user update payload.
     */
    const onUpdateUser:
        SubmitHandler<UpdateUserPayload> =
        async (data) => {
            try {
                await updateUser(data);

                toast.success(
                    "User updated successfully."
                );

                resetUpdate(
                    UPDATE_USER_DEFAULTS
                );

                await loadUsers(
                    currentPage
                );
            } catch (error) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Failed to update user."
                    )
                );
            }
        };

    /**
     * Opens the soft-delete subview for the selected user and pre-populates the
     * deletion form with the selected user's UUID.
     *
     * @param uuid - UUID of the user selected for deletion.
     */
    const handleDeleteUser = (
        uuid: string
    ) => {
        resetDelete({
            uuid,
        });

        setActiveSubView("delete");
    };

    /**
     * Soft-deletes a user after explicit administrator confirmation.
     *
     * The operation preserves the database record while delegating the actual
     * deactivation behavior to the backend. After successful deletion, the
     * directory is refreshed.
     *
     * If the deleted user was the only record on a non-first page, the component
     * navigates to the previous page to avoid displaying an empty page.
     *
     * @param data - Validated payload containing the target user's UUID.
     */
    const onDeleteUser:
        SubmitHandler<DeleteUserPayload> =
        async (data) => {
            const confirmed =
                window.confirm(
                    "Are you sure you want to soft delete this user?\n\n" +
                    "The account will be marked as inactive and access will be revoked, " +
                    "but the record will be retained for audit purposes."
                );

            if (!confirmed) {
                return;
            }

            try {
                await deleteUser(data);

                toast.success(
                    "User soft deleted successfully."
                );

                resetDelete(
                    DELETE_USER_DEFAULTS
                );

                if (
                    users.length === 1 &&
                    currentPage > 0
                ) {
                    setCurrentPage(
                        (page) => page - 1
                    );
                } else {
                    await loadUsers(
                        currentPage
                    );
                }

                setActiveSubView("view");
            } catch (error) {
                toast.error(
                    getErrorMessage(
                        error,
                        "Soft delete failed."
                    )
                );
            }
        };

    return (
        <div className="space-y-6">

            {/* Control Console Header */}
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-2xl font-black text-black tracking-tight">
                    User Operations Console
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                    Synchronized administrative terminal
                    to create users, modify users, and
                    manage authorization.
                </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">

                <button
                    type="button"
                    onClick={() =>
                        setActiveSubView(
                            "view"
                        )
                    }
                    className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView === "view"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    <DatabaseSearch className="h-4 w-4" />

                    Directory & Search
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveSubView(
                            "create"
                        )
                    }
                    className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView ===
                        "create"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    <UserPlus className="h-4 w-4" />

                    Create User
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveSubView(
                            "modify"
                        )
                    }
                    className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView ===
                        "modify"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    <UserRoundPen className="h-4 w-4" />

                    Modify User
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveSubView(
                            "delete"
                        )
                    }
                    className={`flex items-center gap-2 pb-3 px-2 text-sm font-medium transition-all ${
                        activeSubView ===
                        "delete"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400 hover:text-black"
                    }`}
                >
                    <UserRoundX className="h-4 w-4" />

                    Soft Delete User
                </button>
            </div>

            {/* Directory error */}
            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-custom-dark-red font-medium">
                    {errorMessage}
                </div>
            )}

            {/* =================================================
                VIEW: Directory
            ================================================= */}

            {activeSubView === "view" && (
                <div className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">

                        {/* UUID search */}
                        <form
                            onSubmit={handleSubmitSearch(
                                onSearchUser
                            )}
                            className="lg:col-span-2 flex flex-col sm:flex-row gap-2 items-end w-full"
                            noValidate
                        >
                            <div className="grow w-full">

                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                    Query System Directory
                                    by Identifier
                                </label>

                                <input
                                    type="text"
                                    placeholder="Enter target account UUID..."
                                    {...registerSearch(
                                        "uuid"
                                    )}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:border-black placeholder-gray-400 transition-colors"
                                />

                                {searchErrors.uuid && (
                                    <p className="mt-1 text-xs text-custom-dark-red">
                                        {
                                            searchErrors
                                                .uuid
                                                .message
                                        }
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    isLoadingUsers ||
                                    isSearching ||
                                    !isSearchValid
                                }
                                className="w-full sm:w-auto px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 h-9.5"
                            >
                                {isSearching
                                    ? "Searching..."
                                    : "Search Identity"}
                            </button>
                        </form>

                        {/* Sync Directory */}
                        <div className="flex items-end w-full">

                            <button
                                type="button"
                                onClick={() =>
                                    void handleSyncDirectory()
                                }
                                disabled={
                                    isLoadingUsers
                                }
                                className="w-full px-5 py-2 bg-white border border-gray-300 text-black text-sm font-semibold rounded-lg hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-50 h-9.5"
                            >
                                Sync Directory
                            </button>
                        </div>
                    </div>

                    {/* Directory table */}
                    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">

                        <table className="w-full text-left border-collapse">

                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">

                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    System UUID
                                </th>

                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Identity Name
                                </th>

                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                                    Assigned Claim
                                </th>

                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">
                                    Edit
                                </th>

                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-center">
                                    Delete
                                </th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 text-sm">

                            {isLoadingUsers ? (
                                [1, 2, 3].map(
                                    (item) => (
                                        <tr
                                            key={
                                                item
                                            }
                                            className="animate-pulse"
                                        >
                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                            </td>

                                            <td className="p-4">
                                                <div className="h-4 bg-gray-200 rounded w-1/2" />
                                            </td>

                                            <td className="p-4">
                                                <div className="h-6 bg-gray-200 rounded-full w-20" />
                                            </td>

                                            <td className="p-4">
                                                <div className="h-7 bg-gray-200 rounded w-10 mx-auto" />
                                            </td>

                                            <td className="p-4">
                                                <div className="h-7 bg-gray-200 rounded w-10 mx-auto" />
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : users.length >
                            0 ? (
                                users.map(
                                    (user) => (
                                        <tr
                                            key={
                                                user.uuid
                                            }
                                            className="hover:bg-gray-50/70 transition-colors"
                                        >
                                            <td className="p-4 font-mono text-xs text-gray-400 select-all">
                                                {
                                                    user.uuid
                                                }
                                            </td>

                                            <td className="p-4 font-semibold text-black">
                                                {
                                                    user.username
                                                }
                                            </td>

                                            <td className="p-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border ${
                                                            user.role ===
                                                            "ADMIN"
                                                                ? "bg-red-50 border-red-200 text-custom-dark-red"
                                                                : user.role ===
                                                                "NETWORK_ENGINEER"
                                                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                                                    : "bg-gray-50 border-gray-200 text-gray-700"
                                                        }`}
                                                    >
                                                        {
                                                            user.role
                                                        }
                                                    </span>
                                            </td>

                                            <td className="p-4 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEditUser(
                                                            user
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
                                                    title="Edit User"
                                                >
                                                    <UserRoundPen className="h-4 w-4" />
                                                </button>
                                            </td>

                                            <td className="p-4 text-center">

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteUser(
                                                            user.uuid
                                                        )
                                                    }
                                                    className="px-3 py-1 bg-custom-dark-red text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
                                                    title="Soft Delete User"
                                                >
                                                    <UserRoundX className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="p-8 text-center text-sm text-gray-400"
                                    >
                                        No identities
                                        found in the
                                        system registry.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 rounded-b-xl">

                            <div className="text-xs text-gray-500 font-medium">

                                Showing page{" "}

                                <span className="font-bold text-black">
                                    {currentPage +
                                        1}
                                </span>{" "}

                                of{" "}

                                <span className="font-bold text-black">
                                    {totalPages ||
                                        1}
                                </span>{" "}

                                ({totalElements} total
                                entries)
                            </div>

                            <div className="flex gap-2">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                Math.max(
                                                    page -
                                                    1,
                                                    0
                                                )
                                        )
                                    }
                                    disabled={
                                        currentPage ===
                                        0 ||
                                        isLoadingUsers
                                    }
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowLeftToLine className="h-4 w-4" />

                                    Previous
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            (page) =>
                                                page +
                                                1
                                        )
                                    }
                                    disabled={
                                        currentPage +
                                        1 >=
                                        totalPages ||
                                        isLoadingUsers
                                    }
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-black hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next

                                    <ArrowRightToLine className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                CREATE USER
            ================================================= */}

            {activeSubView === "create" && (
                <form
                    onSubmit={handleSubmitCreate(
                        onCreateUser
                    )}
                    noValidate
                    className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4"
                >
                    <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">
                        Provision a New Operator
                        Account
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {/* Username */}
                        <div>

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Username
                            </label>

                            <input
                                type="text"
                                placeholder="2–20 characters"
                                {...registerCreate(
                                    "username"
                                )}
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    username === ""
                                        ? "border-gray-300 focus:border-black"
                                        : isUsernameValid
                                            ? "border-green-500 focus:border-green-600 bg-green-50/20"
                                            : "border-amber-400 focus:border-amber-500 bg-amber-50/20"
                                }`}
                            />

                            {username.length >
                                0 &&
                                !isUsernameValid && (
                                    <span className="text-xs font-medium text-amber-600 mt-1 block">
                                        Must be between
                                        2 and 20
                                        characters (
                                        {
                                            username.trim()
                                                .length
                                        }
                                        /20)
                                    </span>
                                )}

                            {username.length >
                                0 &&
                                isUsernameValid && (
                                    <span className="text-xs font-medium text-green-600 mt-1 block">
                                        Valid username
                                        length
                                    </span>
                                )}

                            {createErrors.username && (
                                <p className="text-xs text-custom-dark-red mt-1">
                                    {
                                        createErrors
                                            .username
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div>

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Password Credentials
                            </label>

                            <input
                                type="password"
                                {...registerCreate(
                                    "password"
                                )}
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    password === ""
                                        ? "border-gray-300 focus:border-black"
                                        : isPasswordValid
                                            ? "border-green-500"
                                            : "border-amber-400"
                                }`}
                            />

                            {password.length >
                                0 &&
                                !isPasswordValid && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-1">

                                        <p className="font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                            Security
                                            Compliance:
                                        </p>

                                        <div
                                            className={
                                                passwordRequirements.hasMinLength
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            Minimum 8
                                            characters
                                        </div>

                                        <div
                                            className={
                                                passwordRequirements.hasUppercase
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            At least one
                                            uppercase
                                            letter (A-Z)
                                        </div>

                                        <div
                                            className={
                                                passwordRequirements.hasLowercase
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            At least one
                                            lowercase
                                            letter (a-z)
                                        </div>

                                        <div
                                            className={
                                                passwordRequirements.hasNumber
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            At least one
                                            numerical
                                            digit (0-9)
                                        </div>

                                        <div
                                            className={
                                                passwordRequirements.hasSpecial
                                                    ? "text-green-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            Special
                                            character
                                            (!@#$%^&+=)
                                        </div>
                                    </div>
                                )}

                            {createErrors.password && (
                                <p className="text-xs text-custom-dark-red mt-1">
                                    {
                                        createErrors
                                            .password
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        {/* Confirm password */}
                        <div>

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                Confirm Password
                            </label>

                            <input
                                type="password"
                                {...registerCreate(
                                    "confirmPassword"
                                )}
                                className={`w-full bg-white border rounded-lg p-2 text-sm text-black focus:outline-none transition-colors ${
                                    confirmPassword ===
                                    ""
                                        ? "border-gray-300 focus:border-black"
                                        : passwordsMatch
                                            ? "border-green-500 focus:border-green-600 bg-green-50/20"
                                            : "border-red-500 focus:border-red-600 bg-red-50/20"
                                }`}
                            />

                            {confirmPassword &&
                                !passwordsMatch && (
                                    <span className="text-xs font-medium text-custom-dark-red mt-1 block">
                                        Passwords do
                                        not match
                                    </span>
                                )}

                            {passwordsMatch && (
                                <span className="text-xs font-medium text-green-600 mt-1 block">
                                    Passwords match
                                </span>
                            )}

                            {createErrors.confirmPassword && (
                                <p className="text-xs text-custom-dark-red mt-1">
                                    {
                                        createErrors
                                            .confirmPassword
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        {/* Role */}
                        <div className="sm:col-span-2">

                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                                RBAC Security Claim
                            </label>

                            <select
                                {...registerCreate(
                                    "role"
                                )}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            >
                                <option value="VIEWER">
                                    VIEWER
                                </option>

                                <option value="NETWORK_ENGINEER">
                                    NETWORK_ENGINEER
                                </option>

                                <option value="ADMIN">
                                    ADMIN
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">

                        <button
                            type="submit"
                            disabled={
                                isCreating ||
                                !isCreateValid
                            }
                            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {isCreating
                                ? "Processing Request..."
                                : "Commit & Register User"}
                        </button>
                    </div>
                </form>
            )}

            {/* =================================================
                MODIFY USER
            ================================================= */}

            {activeSubView === "modify" && (
                <form
                    onSubmit={handleSubmitUpdate(
                        onUpdateUser
                    )}
                    noValidate
                    className="max-w-2xl bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn"
                >
                    <h4 className="text-base font-bold text-black border-b pb-2 border-gray-100">
                        Update Existing Identity
                        Properties
                    </h4>

                    <div>

                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Target Account UUID
                        </label>

                        <input
                            type="text"
                            placeholder="Enter target account UUID..."
                            {...registerUpdate(
                                "uuid"
                            )}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-black"
                        />

                        {updateErrors.uuid && (
                            <p className="text-custom-dark-red text-sm mt-1">
                                {
                                    updateErrors.uuid
                                        .message
                                }
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-4 rounded-lg border border-dashed border-gray-200">

                        <div>

                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                Username
                            </label>

                            <input
                                type="text"
                                {...registerUpdate(
                                    "username"
                                )}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            />

                            {updateErrors.username && (
                                <p className="text-custom-dark-red text-sm mt-1">
                                    {
                                        updateErrors
                                            .username
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <div>

                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                                Override Role Claim
                            </label>

                            <select
                                {...registerUpdate(
                                    "role",
                                    {
                                        setValueAs:
                                            (
                                                value
                                            ) =>
                                                value ===
                                                ""
                                                    ? null
                                                    : value,
                                    }
                                )}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm text-black focus:outline-none focus:border-black"
                            >
                                <option value="">
                                    Keep Existing Role
                                </option>

                                <option value="VIEWER">
                                    VIEWER
                                </option>

                                <option value="NETWORK_ENGINEER">
                                    NETWORK_ENGINEER
                                </option>

                                <option value="ADMIN">
                                    ADMIN
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-2 flex justify-end">

                        <button
                            type="submit"
                            disabled={
                                isUpdating ||
                                !isUpdateValid
                            }
                            className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating
                                ? "Updating..."
                                : "Save Mutation Changes"}
                        </button>
                    </div>
                </form>
            )}

            {/* =================================================
                DELETE USER
            ================================================= */}

            {activeSubView === "delete" && (
                <form
                    onSubmit={handleSubmitDelete(
                        onDeleteUser
                    )}
                    noValidate
                    className="max-w-2xl bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-4 animate-fadeIn"
                >
                    <div className="flex items-start gap-3">

                        <div>
                            <h4 className="text-base font-bold text-custom-dark-red">
                                Soft-De-provision
                                Target Node
                            </h4>

                            <p className="text-xs text-custom-dark-red mt-0.5">
                                Soft deleting removes
                                active token claims and
                                locks SSH interface
                                connectivity, flags the
                                user as inactive in the
                                database, but retains
                                records for audits.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">

                        <div>

                            <label className="block text-xs font-bold text-custom-dark-red uppercase mb-1">
                                Target Account System
                                UUID
                            </label>

                            <input
                                type="text"
                                placeholder="Enter target account UUID..."
                                {...registerDelete(
                                    "uuid"
                                )}
                                className="w-full bg-white border border-red-200 rounded-lg p-2 text-sm font-mono text-black focus:outline-none focus:border-red-500 placeholder-red-200"
                            />

                            {deleteErrors.uuid && (
                                <p className="text-custom-dark-red text-sm mt-1">
                                    {
                                        deleteErrors.uuid
                                            .message
                                    }
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2">

                            <button
                                type="submit"
                                disabled={
                                    isDeleting ||
                                    !isDeleteValid
                                }
                                className="px-5 py-2 bg-custom-dark-red text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0 h-9.5"
                            >
                                {isDeleting
                                    ? "Deleting..."
                                    : "Revoke & Soft Delete"}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}