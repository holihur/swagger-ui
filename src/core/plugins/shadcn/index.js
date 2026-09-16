/**
 * shadcn/ui shell plugin.
 *
 * Overrides the Topbar with a shadcn implementation and swaps the generic
 * Button/Input components for their shadcn equivalents. Everything is layered
 * on top of the existing components through the plugin system, so no core
 * component is modified.
 *
 * @prettier
 */
import Topbar from "./components/Topbar"
import {
  ShadcnButtonAdapter,
  ShadcnInputAdapter,
  withToaster,
} from "./components/adapters"

const ShadcnPlugin = () => ({
  components: {
    Topbar,
    Button: ShadcnButtonAdapter,
    Input: ShadcnInputAdapter,
  },
  wrapComponents: {
    App: withToaster,
  },
})

export default ShadcnPlugin
