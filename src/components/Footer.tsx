const Footer = () => {

    const currentYear: number = new Date().getFullYear();

    return (
        <>
            <footer className="bg-custom-primary-light text-black">
                <div className="container mx-auto py-8 text-center">
                    &copy; {currentYear} Coding Factory 9. All Rights reserved.
                </div>
            </footer>
        </>
    )
}

export default Footer;