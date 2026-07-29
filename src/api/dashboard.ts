import {type ViewerDashboardResponse, viewerDashboardResponseSchema} from "@/schemas/dashboard.ts";
import {API_URL, getAuthorizationHeaders, getErrorMessage} from "@/api/config.ts";

export async function getViewerDashboard():
    Promise<ViewerDashboardResponse> {
    const response = await fetch(
        `${API_URL}/dashboard/viewer`,
        {
            method: "GET",
            headers: getAuthorizationHeaders(),
        }
    );

    if (!response.ok) {
        throw new Error(
            await getErrorMessage(
                response,
                "Failed to retrieve dashboard metrics."
            )
        );
    }

    const data: unknown =
        await response.json();

    return viewerDashboardResponseSchema.parse(
        data
    );
}