/**
 * @prettier
 */
import Logo from "./components/Logo"
import DarkModeToggle from "./components/DarkModeToggle"

// The Topbar itself is provided by the shadcn plugin (core/plugins/shadcn).
// This plugin only contributes the standalone branding components it needs.
const TopBarPlugin = () => ({
  components: { Logo, DarkModeToggle },
})

export default TopBarPlugin
