import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
    children: React.ReactNode;
    addClasses?: string;
}

const Layout = ({children, addClasses}:LayoutProps) => {
    return (
        <>
            <div className={addClasses}>
                <Header/>
                <main className="container mx-auto min-h-[95vh] pt-36">{children}</main>
                <Footer/>
            </div>

        </>
    )
}

export default Layout;