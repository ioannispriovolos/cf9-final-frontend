import Cookies from 'js-cookie'

/**
 * Stores a cookie in the browser.
 *
 * This function provides a small abstraction around `js-cookie` for creating
 * cookies used by the application. Optional cookie attributes can be supplied
 * to configure properties such as expiration, path, SameSite behavior,
 * and the Secure flag.
 *
 * @param name - Name of the cookie to create or update.
 * @param value - String value to store in the cookie.
 * @param options - Optional cookie attributes controlling the cookie's
 * behavior and lifetime.
 */
export function setCookie(
    name: string,
    value: string,
    options?: Cookies.CookieAttributes
) {
    Cookies.set(name, value, options)
}

/**
 * Retrieves the value of a cookie from the browser.
 *
 * The function returns the cookie value when a cookie with the specified
 * name exists. If the cookie cannot be found or is not accessible,
 * `undefined` is returned.
 *
 * @param name - Name of the cookie to retrieve.
 *
 * @returns The cookie value, or `undefined` when the cookie does not exist
 * or is unavailable.
 */
export function getCookie(name: string): string | undefined {
    return Cookies.get(name)
}

/**
 * Removes a cookie from the browser.
 *
 * Optional cookie attributes may be supplied when removal requires the same
 * path or other relevant attributes that were used when the cookie was
 * originally created.
 *
 * @param name - Name of the cookie to remove.
 * @param options - Optional cookie attributes used to identify the cookie
 * that should be removed.
 */
export function deleteCookie(name: string, options?: Cookies.CookieAttributes): void {
    Cookies.remove(name, options)
}