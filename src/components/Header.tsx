import {Link} from "react-router";
import {AuthButton} from "@/components/AuthButton.tsx";

const Header = () => {

    return (
        <>
            <header className="bg-custom-primary fixed w-full z-50">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <Link to="/">
                        <img src="https://miro.medium.com/1*8ebQwZcMBgsZ6prLW8p-HA.png" alt="SSH logo" className="my-4 h-16"/>
                    </Link>


                    <nav className="flex gap-4 items-center text-white font-medium">
                        <Link to="/">Home</Link>
                        {/*<Link to="/products">Products</Link>*/}
                        <AuthButton/>
                    </nav>
                </div>
            </header>
        </>
    )
}

export default Header;