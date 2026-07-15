import {Link} from "react-router";
import {AuthButton} from "@/components/AuthButton.tsx";

const Header = () => {

    return (
        <>
            <header className="bg-cf-dark-red fixed w-full z-50">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <Link to="/">
                        <img src="https://codingfactory.aueb.gr/sites/all/themes/cf_theme/logo.png" alt="CF logo" className="my-4 h-16"/>
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