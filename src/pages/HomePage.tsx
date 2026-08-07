import {
    ArrowRight,
    Database,
    KeyRound,
    LockKeyhole,
    Network,
    Server,
    ShieldCheck,
    Terminal,
    UserCog,
    Users,
} from "lucide-react";

import { Link } from "react-router";

export default function HomePage() {
    return (
        <div className="w-full bg-white text-black">

            {/* HERO */}
            <section className="border-b border-gray-200 bg-linear-to-b from-gray-50 to-white">
                <div className="container mx-auto grid min-h-[70vh] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:px-10">

                    {/* Hero copy */}
                    <div className="max-w-2xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
                            <Network className="h-4 w-4 text-custom-dark-red" />
                            Network Infrastructure Management Platform
                        </div>

                        <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                            Manage network devices from one secure platform.
                        </h1>

                        <p className="mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg">
                            A full-stack infrastructure management application designed
                            for centralized device administration, role-based access,
                            secure SSH command execution, and real-time operational
                            visibility.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                            >
                                Access Platform
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <a
                                href="#features"
                                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
                            >
                                Explore Features
                            </a>
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="relative">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xl">
                            <div className="rounded-xl border border-gray-800 bg-gray-950 p-5 font-mono text-xs text-green-400">
                                <div className="mb-4 flex items-center gap-2 border-b border-gray-800 pb-3">
                                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
                                    <span className="h-2.5 w-2.5 rounded-full bg-green-500" />

                                    <span className="ml-2 text-[11px] font-semibold text-gray-400">
                                        SSH Fleet Console
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <p>
                                        <span className="text-gray-500">$</span>{" "}
                                        /system resource print
                                    </p>

                                    <p className="text-gray-500">
                                        Target Scope: 6 selected devices
                                    </p>

                                    <p>
                                        [Core Router]{" "}
                                        <span className="text-green-400">
                                            SUCCESS
                                        </span>
                                    </p>

                                    <p>
                                        [Edge Router]{" "}
                                        <span className="text-green-400">
                                            SUCCESS
                                        </span>
                                    </p>

                                    <p>
                                        [Branch Router]{" "}
                                        <span className="text-green-400">
                                            SUCCESS
                                        </span>
                                    </p>

                                    <p className="pt-2 text-gray-500">
                                        Command completed successfully.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-5 -left-5 hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:block">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                                    <ShieldCheck className="h-5 w-5 text-green-700" />
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-gray-500">
                                        Security
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                        JWT + RBAC
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES */}
            <section
                id="features"
                className="border-b border-gray-200 bg-white py-20"
            >
                <div className="container mx-auto px-6 lg:px-10">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-custom-dark-red">
                            Platform Capabilities
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                            Built for secure infrastructure operations
                        </h2>

                        <p className="mt-4 text-sm leading-6 text-gray-600 sm:text-base">
                            The application combines user administration, device
                            inventory, SSH automation, security, and operational
                            metrics in a single interface.
                        </p>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                        <FeatureCard
                            icon={Server}
                            title="Device Management"
                            description="Register, update, paginate, and soft-delete network devices from a centralized device directory."
                        />

                        <FeatureCard
                            icon={Terminal}
                            title="SSH Fleet Execution"
                            description="Execute commands against one or multiple selected devices and review per-device execution results."
                        />

                        <FeatureCard
                            icon={Users}
                            title="User Administration"
                            description="Create, update, search, paginate, and soft-delete platform identities."
                        />

                        <FeatureCard
                            icon={ShieldCheck}
                            title="Role-Based Access"
                            description="Separate permissions between administrators, network engineers, and read-only viewers."
                        />

                        <FeatureCard
                            icon={LockKeyhole}
                            title="Secure Authentication"
                            description="JWT-based authentication protects backend resources and enables capability-driven authorization."
                        />

                        <FeatureCard
                            icon={Database}
                            title="Persistent Infrastructure Data"
                            description="PostgreSQL persistence with structured migrations and paginated REST API access."
                        />
                    </div>
                </div>
            </section>

            {/* ROLES */}
            <section className="border-b border-gray-200 bg-gray-50 py-20">
                <div className="container mx-auto px-6 lg:px-10">

                    <div className="mb-10">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-custom-dark-red">
                            RBAC Model
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950">
                            Access based on responsibility
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                        <RoleCard
                            icon={UserCog}
                            title="Administrator"
                            description="Full administrative access for managing users, roles, devices, SSH operations, and system metrics."
                            capabilities={[
                                "User management",
                                "Device management",
                                "SSH command execution",
                                "System metrics",
                            ]}
                        />

                        <RoleCard
                            icon={Terminal}
                            title="Network Engineer"
                            description="Operational access focused on network devices and SSH execution without full identity administration."
                            capabilities={[
                                "View devices",
                                "Execute SSH commands",
                                "Operate selected device groups",
                                "Review execution results",
                            ]}
                        />

                        <RoleCard
                            icon={Users}
                            title="Viewer"
                            description="Read-oriented access intended for observing system and infrastructure information."
                            capabilities={[
                                "View infrastructure metrics",
                                "Review device information",
                                "Monitor platform data",
                                "No administrative mutation",
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* ARCHITECTURE / TECH */}
            <section className="border-b border-gray-200 bg-white py-20">
                <div className="container mx-auto grid grid-cols-1 gap-10 px-6 lg:grid-cols-2 lg:px-10">

                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-custom-dark-red">
                            Architecture
                        </p>

                        <h2 className="mt-3 text-3xl font-black tracking-tight">
                            Full-stack application architecture
                        </h2>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600">
                            The platform uses a Spring Boot REST backend, React and
                            TypeScript frontend, PostgreSQL persistence, Flyway
                            migrations, JWT security, and Docker-based deployment.
                        </p>

                        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {[
                                "Java 21",
                                "Spring Boot",
                                "React",
                                "TypeScript",
                                "PostgreSQL",
                                "Docker",
                                "Flyway",
                                "JWT",
                                "Zod",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs font-semibold text-gray-700"
                                >
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
                        <div className="space-y-4">

                            <ArchitectureRow
                                icon={Users}
                                title="React Frontend"
                                description="Responsive UI, form validation, role-aware navigation"
                            />

                            <ArchitectureRow
                                icon={KeyRound}
                                title="Security Layer"
                                description="Authentication, JWT validation, authorization"
                            />

                            <ArchitectureRow
                                icon={Server}
                                title="Spring Boot REST API"
                                description="Controllers, services, DTOs, validators, repositories"
                            />

                            <ArchitectureRow
                                icon={Database}
                                title="PostgreSQL"
                                description="Persistent users, devices, roles, and capabilities"
                            />

                            <ArchitectureRow
                                icon={Terminal}
                                title="SSH Engine"
                                description="Secure remote command execution across network devices"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* SECURITY */}
            <section className="bg-gray-950 py-20 text-white">
                <div className="container mx-auto grid grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2 lg:px-10">

                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-700 bg-gray-900">
                            <ShieldCheck className="h-6 w-6 text-green-400" />
                        </div>

                        <h2 className="mt-5 text-3xl font-black tracking-tight">
                            Security built into the platform
                        </h2>

                        <p className="mt-4 max-w-xl text-sm leading-6 text-gray-400">
                            Sensitive operations are protected through authenticated
                            API access, role-based permissions, password hashing,
                            encrypted device credentials, and controlled backend SSH
                            execution.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {[
                            "JWT Authentication",
                            "RBAC Authorization",
                            "Encrypted Device Credentials",
                            "Hashed User Passwords",
                            "Protected REST Endpoints",
                            "Soft Delete Audit Retention",
                        ].map((feature) => (
                            <div
                                key={feature}
                                className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4"
                            >
                                <ShieldCheck className="h-4 w-4 shrink-0 text-green-400" />
                                <span className="text-sm font-medium text-gray-200">
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-white py-20">
                <div className="container mx-auto px-6 lg:px-10">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-6 py-12 text-center shadow-sm sm:px-10">
                        <h2 className="text-3xl font-black tracking-tight text-gray-950">
                            Explore the platform
                        </h2>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-600">
                            Sign in with one of the available demo roles to explore
                            user administration, SSH execution, device management,
                            and infrastructure metrics.
                        </p>

                        <Link
                            to="/login"
                            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                        >
                            Go to Login
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

type FeatureCardProps = {
    icon: React.ElementType;
    title: string;
    description: string;
};

function FeatureCard({
                         icon: Icon,
                         title,
                         description,
                     }: FeatureCardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Icon className="h-5 w-5 text-custom-dark-red" />
            </div>

            <h3 className="mt-4 text-base font-bold text-gray-950">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
            </p>
        </div>
    );
}

type RoleCardProps = {
    icon: React.ElementType;
    title: string;
    description: string;
    capabilities: string[];
};

function RoleCard({
                      icon: Icon,
                      title,
                      description,
                      capabilities,
                  }: RoleCardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
                <Icon className="h-5 w-5 text-white" />
            </div>

            <h3 className="mt-4 text-lg font-bold">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
                {description}
            </p>

            <ul className="mt-5 space-y-2">
                {capabilities.map((capability) => (
                    <li
                        key={capability}
                        className="flex items-center gap-2 text-sm text-gray-700"
                    >
                        <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                        {capability}
                    </li>
                ))}
            </ul>
        </div>
    );
}

type ArchitectureRowProps = {
    icon: React.ElementType;
    title: string;
    description: string;
};

function ArchitectureRow({
                             icon: Icon,
                             title,
                             description,
                         }: ArchitectureRowProps) {
    return (
        <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-950">
                <Icon className="h-5 w-5 text-white" />
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-900">
                    {title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                    {description}
                </p>
            </div>
        </div>
    );
}