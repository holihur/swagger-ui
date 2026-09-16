import React from "react"
import { shallow } from "enzyme"
import TopBar from "standalone/plugins/top-bar/components/TopBar"

const Component = () => null
const getComponent = () => Component
const getConfigs = () => ({})
const specSelectors = { loadingStatus: () => null, url: () => "" }

const languages = [
  { name: "English", url: "/swagger/en.json" },
  { name: "中文", url: "/swagger/zh-CN.json" },
  { name: "日本語", url: "/swagger/ja.json" },
]

const renderTopBar = (
  configs,
  specActions = { download: jest.fn(), updateUrl: jest.fn() }
) => {
  const getTopBarConfigs = () => configs
  return shallow(
    <TopBar
      authActions={{ restoreAuthorization: jest.fn() }}
      getComponent={getComponent}
      getConfigs={getTopBarConfigs}
      layoutActions={{ updateFilter: jest.fn() }}
      specActions={specActions}
      specSelectors={specSelectors}
    />
  )
}

describe("<TopBar />", function () {
  it("provides the banner landmark", function () {
    const layoutActions = { updateFilter: jest.fn() }
    const specActions = { download: jest.fn(), updateUrl: jest.fn() }
    const wrapper = shallow(
      <TopBar
        authActions={{ restoreAuthorization: jest.fn() }}
        getComponent={getComponent}
        getConfigs={getConfigs}
        layoutActions={layoutActions}
        specActions={specActions}
        specSelectors={specSelectors}
      />
    )

    expect(wrapper.type()).toEqual("header")
    expect(wrapper.props().role).toEqual("banner")
  })

  it("renders a language switcher when languages are configured", function () {
    const specActions = { download: jest.fn(), updateUrl: jest.fn() }
    const wrapper = renderTopBar({ languages }, specActions)

    const select = wrapper.find("#select-language")
    expect(select.exists()).toBe(true)
    expect(select.children()).toHaveLength(3)
    expect(specActions.download).toHaveBeenCalledWith("/swagger/en.json")
    expect(specActions.updateUrl).toHaveBeenCalledWith("/swagger/en.json")
  })

  it("respects a `languages.primaryName`", function () {
    const configured = languages.slice()
    configured.primaryName = "中文"

    const specActions = { download: jest.fn(), updateUrl: jest.fn() }
    const wrapper = renderTopBar({ languages: configured }, specActions)

    expect(wrapper.find("#select-language").props().value).toEqual(
      "/swagger/zh-CN.json"
    )
    expect(specActions.download).toHaveBeenCalledWith("/swagger/zh-CN.json")
  })

  it("loads the selected language on change", function () {
    const specActions = { download: jest.fn(), updateUrl: jest.fn() }
    const wrapper = renderTopBar({ languages }, specActions)

    specActions.download.mockClear()

    wrapper.find("#select-language").simulate("change", {
      target: { value: "/swagger/ja.json" },
      preventDefault: jest.fn(),
    })

    expect(specActions.download).toHaveBeenCalledWith("/swagger/ja.json")
  })

  it("renders both a definition and a language switcher", function () {
    const configs = {
      urls: [
        { name: "One", url: "/one.json" },
        { name: "Two", url: "/two.json" },
      ],
      languages,
    }
    const wrapper = renderTopBar(configs)

    expect(wrapper.find("#select").exists()).toBe(true)
    expect(wrapper.find("#select-language").exists()).toBe(true)
  })
})
