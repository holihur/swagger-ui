import React from "react"
import { shallow } from "enzyme"

import ShadcnPlugin from "core/plugins/shadcn"
import Topbar from "core/plugins/shadcn/components/Topbar"

const Component = () => null
const getComponent = () => Component
const specSelectors = { loadingStatus: () => null, url: () => "" }

const renderTopbar = (configs) => {
  const getConfigs = () => configs
  const specActions = { download: jest.fn(), updateUrl: jest.fn() }

  const wrapper = shallow(
    <Topbar
      authActions={{ restoreAuthorization: jest.fn() }}
      getComponent={getComponent}
      getConfigs={getConfigs}
      layoutActions={{ updateFilter: jest.fn() }}
      specActions={specActions}
      specSelectors={specSelectors}
    />
  )

  return { wrapper, specActions }
}

describe("shadcn plugin", () => {
  it("overrides the Topbar, Button and Input components", () => {
    const plugin = ShadcnPlugin()

    expect(plugin.components.Topbar).toBeDefined()
    expect(plugin.components.Button).toBeDefined()
    expect(plugin.components.Input).toBeDefined()
    expect(typeof plugin.wrapComponents.App).toBe("function")
  })
})

describe("<Topbar /> (shadcn)", () => {
  it("loads the first language by default", () => {
    const languages = [
      { name: "English", url: "/en.json" },
      { name: "中文", url: "/zh.json" },
    ]

    const { specActions } = renderTopbar({ languages })

    expect(specActions.download).toHaveBeenCalledWith("/en.json")
    expect(specActions.updateUrl).toHaveBeenCalledWith("/en.json")
  })

  it("respects a `languages.primaryName`", () => {
    const languages = [
      { name: "English", url: "/en.json" },
      { name: "中文", url: "/zh.json" },
    ]
    languages.primaryName = "中文"

    const { wrapper, specActions } = renderTopbar({ languages })

    expect(specActions.download).toHaveBeenCalledWith("/zh.json")
    expect(wrapper.find("Select").length).toBeGreaterThan(0)
  })

  it("loads the primary definition when urls are configured", () => {
    const urls = [
      { name: "One", url: "/one.json" },
      { name: "Two", url: "/two.json" },
    ]
    urls.primaryName = "Two"

    const { specActions } = renderTopbar({ urls })

    expect(specActions.download).toHaveBeenCalledWith("/two.json")
  })

  it("renders an input and explore button when no urls or languages exist", () => {
    const { wrapper } = renderTopbar({})

    expect(wrapper.find("#download-url-input").exists()).toBe(true)
    expect(wrapper.find("Button").exists()).toBe(true)
  })
})
