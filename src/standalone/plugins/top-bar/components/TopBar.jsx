import React, { cloneElement } from "react"
import PropTypes from "prop-types"

import { parseSearch, serializeSearch } from "core/utils"

class TopBar extends React.Component {
  static propTypes = {
    layoutActions: PropTypes.object.isRequired,
    authActions: PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      url: props.specSelectors.url(),
      selectedIndex: 0,
      selectedLanguageIndex: 0,
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ url: nextProps.specSelectors.url() })
  }

  onUrlChange = (e) => {
    let {
      target: { value },
    } = e
    this.setState({ url: value })
  }

  flushAuthData() {
    const { persistAuthorization } = this.props.getConfigs()
    if (persistAuthorization) {
      return
    }
    this.props.authActions.restoreAuthorization({
      authorized: {},
    })
  }

  loadSpec = (url) => {
    this.flushAuthData()
    this.props.specActions.updateUrl(url)
    this.props.specActions.download(url)
  }

  onUrlSelect = (e) => {
    let url = e.target.value || e.target.href
    this.loadSpec(url)
    this.setSelectedUrl(url)
    e.preventDefault()
  }

  onLanguageSelect = (e) => {
    let url = e.target.value || e.target.href
    this.loadSpec(url)
    this.setSelectedLanguage(url)
    e.preventDefault()
  }

  downloadUrl = (e) => {
    this.loadSpec(this.state.url)
    e.preventDefault()
  }

  setSearch = (spec) => {
    let search = parseSearch()
    search["urls.primaryName"] = spec.name
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (window && window.history && window.history.pushState) {
      window.history.replaceState(null, "", `${newUrl}?${serializeSearch(search)}`)
    }
  }

  setLanguageSearch = (language) => {
    let search = parseSearch()
    search["languages.primaryName"] = language.name
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (window && window.history && window.history.pushState) {
      window.history.replaceState(null, "", `${newUrl}?${serializeSearch(search)}`)
    }
  }

  setSelectedUrl = (selectedUrl) => {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []

    if (urls && urls.length) {
      if (selectedUrl) {
        urls.forEach((spec, i) => {
          if (spec.url === selectedUrl) {
            this.setState({ selectedIndex: i })
            this.setSearch(spec)
          }
        })
      }
    }
  }

  setSelectedLanguage = (selectedUrl) => {
    const configs = this.props.getConfigs()
    const languages = configs.languages || []

    if (languages && languages.length) {
      if (selectedUrl) {
        languages.forEach((language, i) => {
          if (language.url === selectedUrl) {
            this.setState({ selectedLanguageIndex: i })
            this.setLanguageSearch(language)
          }
        })
      }
    }
  }

  componentDidMount() {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []
    const languages = configs.languages || []
    let search = parseSearch()

    if (urls && urls.length) {
      var targetIndex = this.state.selectedIndex
      let primaryName = search["urls.primaryName"] || configs.urls.primaryName
      if (primaryName) {
        urls.forEach((spec, i) => {
          if (spec.name === primaryName) {
            this.setState({ selectedIndex: i })
            targetIndex = i
          }
        })
      }

      this.loadSpec(urls[targetIndex].url)
    }

    if (languages && languages.length) {
      let targetLanguageIndex = this.state.selectedLanguageIndex
      let primaryName =
        search["languages.primaryName"] || configs.languages.primaryName
      if (primaryName) {
        languages.forEach((language, i) => {
          if (language.name === primaryName) {
            this.setState({ selectedLanguageIndex: i })
            targetLanguageIndex = i
          }
        })
      }

      // The definition dropdown already triggered the initial download.
      if (!urls || !urls.length) {
        this.loadSpec(languages[targetLanguageIndex].url)
      }
    }
  }

  onFilterChange = (e) => {
    let {
      target: { value },
    } = e
    this.props.layoutActions.updateFilter(value)
  }

  render() {
    let { getComponent, specSelectors, getConfigs } = this.props
    const Button = getComponent("Button")
    const Link = getComponent("Link")
    const Logo = getComponent("Logo")
    const DarkModeToggle = getComponent("DarkModeToggle")

    let isLoading = specSelectors.loadingStatus() === "loading"
    let isFailed = specSelectors.loadingStatus() === "failed"

    const classNames = ["download-url-input"]
    if (isFailed) classNames.push("failed")
    if (isLoading) classNames.push("loading")

    const { urls, languages } = getConfigs()
    let control = []
    let formOnSubmit = null

    if (urls && urls.length) {
      let rows = []
      urls.forEach((link, i) => {
        rows.push(
          <option key={i} value={link.url}>
            {link.name}
          </option>
        )
      })

      const selectedUrl =
        urls[this.state.selectedIndex] !== undefined
          ? urls[this.state.selectedIndex].url
          : undefined

      control.push(
        <label className="select-label" htmlFor="select">
          <span>Select a definition</span>
          <select id="select" disabled={isLoading} onChange={this.onUrlSelect} value={selectedUrl}>
            {rows}
          </select>
        </label>
      )
    }

    if (languages && languages.length) {
      let rows = []
      languages.forEach((language, i) => {
        rows.push(
          <option key={i} value={language.url}>
            {language.name}
          </option>
        )
      })

      const selectedLanguage =
        languages[this.state.selectedLanguageIndex] !== undefined
          ? languages[this.state.selectedLanguageIndex].url
          : undefined

      control.push(
        <label className="select-label language-select-label" htmlFor="select-language">
          <span>Select a language</span>
          <select
            id="select-language"
            disabled={isLoading}
            onChange={this.onLanguageSelect}
            value={selectedLanguage}
          >
            {rows}
          </select>
        </label>
      )
    }

    if ((!urls || !urls.length) && (!languages || !languages.length)) {
      formOnSubmit = this.downloadUrl
      control.push(
        <input
          className={classNames.join(" ")}
          type="text"
          onChange={this.onUrlChange}
          value={this.state.url}
          disabled={isLoading}
          id="download-url-input"
        />
      )
      control.push(
        <Button className="download-url-button" onClick={this.downloadUrl}>
          Explore
        </Button>
      )
    }

    return (
      <header className="topbar" role="banner">
        <div className="wrapper">
          <div className="topbar-wrapper">
            <Link>
              <Logo />
            </Link>
            <form className="download-url-wrapper" onSubmit={formOnSubmit}>
              {control.map((el, i) => cloneElement(el, { key: i }))}
            </form>
            <DarkModeToggle />
          </div>
        </div>
      </header>
    )
  }
}

TopBar.propTypes = {
  specSelectors: PropTypes.object.isRequired,
  specActions: PropTypes.object.isRequired,
  getComponent: PropTypes.func.isRequired,
  getConfigs: PropTypes.func.isRequired,
}

export default TopBar
