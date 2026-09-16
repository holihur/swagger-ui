import React from "react"
import PropTypes from "prop-types"
import { toast } from "sonner"

import { parseSearch, serializeSearch } from "core/utils"

import { Button } from "../../../../shadcn/components/ui/button"
import { Input } from "../../../../shadcn/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../shadcn/components/ui/select"

class Topbar extends React.Component {
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
    this.setState({ url: e.target.value })
  }

  flushAuthData() {
    const { persistAuthorization } = this.props.getConfigs()
    if (persistAuthorization) {
      return
    }
    this.props.authActions.restoreAuthorization({ authorized: {} })
  }

  loadSpec = (url) => {
    this.flushAuthData()
    this.props.specActions.updateUrl(url)
    this.props.specActions.download(url)
  }

  onUrlSelect = (url) => {
    this.loadSpec(url)
    this.setSelectedUrl(url)
  }

  onLanguageSelect = (url) => {
    this.loadSpec(url)
    this.setSelectedLanguage(url)
  }

  downloadUrl = (e) => {
    e.preventDefault()
    this.loadSpec(this.state.url)
  }

  persistSearch(key, value) {
    const search = parseSearch()
    search[key] = value
    const newUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`
    if (window && window.history && window.history.pushState) {
      window.history.replaceState(null, "", `${newUrl}?${serializeSearch(search)}`)
    }
  }

  setSelectedUrl = (selectedUrl) => {
    const urls = this.props.getConfigs().urls || []

    if (urls && urls.length) {
      urls.forEach((spec, i) => {
        if (spec.url === selectedUrl) {
          this.setState({ selectedIndex: i })
          this.persistSearch("urls.primaryName", spec.name)
        }
      })
    }
  }

  setSelectedLanguage = (selectedUrl) => {
    const languages = this.props.getConfigs().languages || []

    if (languages && languages.length) {
      languages.forEach((language, i) => {
        if (language.url === selectedUrl) {
          this.setState({ selectedLanguageIndex: i })
          this.persistSearch("languages.primaryName", language.name)
          toast.success(`Language: ${language.name}`)
        }
      })
    }
  }

  componentDidMount() {
    const configs = this.props.getConfigs()
    const urls = configs.urls || []
    const languages = configs.languages || []
    const search = parseSearch()

    if (urls && urls.length) {
      let targetIndex = this.state.selectedIndex
      const primaryName = search["urls.primaryName"] || configs.urls.primaryName
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
      const primaryName =
        search["languages.primaryName"] || configs.languages.primaryName
      if (primaryName) {
        languages.forEach((language, i) => {
          if (language.name === primaryName) {
            this.setState({ selectedLanguageIndex: i })
            targetLanguageIndex = i
          }
        })
      }

      if (!urls || !urls.length) {
        this.loadSpec(languages[targetLanguageIndex].url)
      }
    }
  }

  onFilterChange = (e) => {
    this.props.layoutActions.updateFilter(e.target.value)
  }

  render() {
    const { getComponent, specSelectors, getConfigs } = this.props
    const Link = getComponent("Link")
    const Logo = getComponent("Logo")
    const DarkModeToggle = getComponent("DarkModeToggle")

    const isLoading = specSelectors.loadingStatus() === "loading"

    const { urls, languages } = getConfigs()

    const hasUrls = urls && urls.length
    const hasLanguages = languages && languages.length

    const definitionValue = hasUrls
      ? urls[this.state.selectedIndex]?.url
      : undefined
    const languageValue = hasLanguages
      ? languages[this.state.selectedLanguageIndex]?.url
      : undefined

    return (
      <header className="topbar" role="banner">
        <div className="wrapper">
          <div className="topbar-wrapper">
            <Link>
              <Logo />
            </Link>
            <form className="download-url-wrapper" onSubmit={this.downloadUrl}>
              {hasUrls ? (
                <Select
                  value={definitionValue}
                  onValueChange={this.onUrlSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    aria-label="Select a definition"
                    data-testid="definition-select"
                    className="ui-max-w-[320px]"
                  >
                    <SelectValue placeholder="Select a definition" />
                  </SelectTrigger>
                  <SelectContent>
                    {urls.map((link, i) => (
                      <SelectItem key={i} value={link.url}>
                        {link.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {hasLanguages ? (
                <Select
                  value={languageValue}
                  onValueChange={this.onLanguageSelect}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    aria-label="Select a language"
                    data-testid="language-select"
                    className="ui-ml-2 ui-max-w-[200px]"
                  >
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language, i) => (
                      <SelectItem key={i} value={language.url}>
                        {language.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {!hasUrls && !hasLanguages ? (
                <>
                  <Input
                    type="text"
                    value={this.state.url}
                    onChange={this.onUrlChange}
                    disabled={isLoading}
                    id="download-url-input"
                  />
                  <Button type="submit" className="ui-ml-2">
                    Explore
                  </Button>
                </>
              ) : null}
            </form>
            <DarkModeToggle />
          </div>
        </div>
      </header>
    )
  }
}

export default Topbar
