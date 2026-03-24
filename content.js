(() => {
  "use strict";

  const settingsApi = globalThis.YouTubeMinimalSettings;
  if (!settingsApi) {
    console.error("YouTube Minimal: settings.js must load before content.js");
    return;
  }

  const DEFAULT_SETTINGS = settingsApi.DEFAULT_SETTINGS;

  const STYLE_ID = "yt-minimal-style";
  const BANNER_ID = "yt-minimal-banner";
  const HIDDEN_ATTRIBUTE = "data-yt-minimal-hidden";
  const APPLIED_ATTRIBUTE = "data-yt-minimal-applied";
  const STORAGE_KEY = settingsApi.STORAGE_KEY;

  const SELECTORS = {
    adsAndUpsells: [
      "ytd-ad-slot-renderer",
      "ytd-display-ad-renderer",
      "ytd-promoted-video-renderer",
      "ytd-promoted-sparkles-web-renderer",
      "ytd-promoted-sparkles-text-search-renderer",
      "ytd-companion-slot-renderer",
      "#player-ads",
      ".video-ads",
      ".ytp-ad-module",
      ".ytp-ad-overlay-container",
      ".ytp-ad-progress-list",
      "ytd-mealbar-promo-renderer",
      "ytd-banner-promo-renderer",
      "yt-mealbar-promo-renderer",
      "ytd-feed-nudge-renderer",
      "ytd-primetime-promo-renderer",
      "masthead-ad",
    ],
    donations: [
      "ytd-donation-shelf-renderer",
      "ytd-donation-companion-renderer",
      "ytd-call-to-action-renderer",
      "ytd-fact-check-renderer",
      "ytd-clarification-renderer",
      "ytd-emergency-onebox-renderer",
    ],
    recommendations: [
      "#related",
      "ytd-watch-flexy #secondary",
      "ytd-watch-next-secondary-results-renderer",
      "ytd-item-section-renderer[section-identifier='related-items']",
      ".ytp-ce-element",
      ".ytp-endscreen-content",
      ".html5-endscreen",
      ".videowall-endscreen",
    ],
    comments: [
      "#comments",
      "ytd-comments",
      "ytd-engagement-panel-section-list-renderer[target-id='engagement-panel-comments-section']",
    ],
    liveChat: [
      "ytd-live-chat-frame",
      "ytd-live-chat-frame #chat",
      "ytd-watch-flexy #chat-container",
    ],
    notificationsBell: [
      "ytd-notification-topbar-button-renderer",
      "#button.ytd-notification-topbar-button-renderer",
    ],
    sidebar: [
      "ytd-guide-renderer",
      "ytd-mini-guide-renderer",
      "tp-yt-app-drawer",
    ],
    searchSuggestions: [
      "ytd-searchbox-suggestions",
      "ytd-searchbox-spt[has-suggestions]",
      "yt-searchbox-suggestions-container",
    ],
    autoplayToggle: [
      "ytd-compact-autoplay-renderer",
      ".ytp-autonav-toggle-button-container",
      ".ytp-autonav-endscreen-upnext-alternative-header",
    ],
    miniplayerButton: [
      ".ytp-miniplayer-button",
      "ytd-miniplayer-button-renderer",
      "ytd-miniplayer",
    ],
    channelAvatars: [
      "ytd-video-owner-renderer #avatar",
      "ytd-video-owner-renderer #avatar-link",
      "ytd-rich-item-renderer #avatar-container",
      "ytd-rich-item-renderer #avatar-link",
      "ytd-grid-video-renderer #avatar-container",
      "ytd-grid-video-renderer #avatar-link",
      "ytd-video-renderer #avatar-container",
      "ytd-video-renderer #avatar-link",
      "ytd-compact-video-renderer #avatar-container",
      "ytd-compact-video-renderer #avatar-link",
      "ytd-comment-thread-renderer #author-thumbnail",
      "ytd-comment-renderer #author-thumbnail",
    ],
    subscriptionsSection: [
      "ytd-browse[page-subtype='subscriptions'] ytd-rich-grid-renderer",
      "ytd-browse[page-subtype='subscriptions'] #contents",
      "ytd-guide-entry-renderer a[href='/feed/subscriptions']",
      "ytd-mini-guide-entry-renderer a[href='/feed/subscriptions']",
    ],
    homeFeed: [
      "ytd-browse[page-subtype='home'] ytd-rich-grid-renderer",
      "ytd-browse[page-subtype='home'] #contents",
      "ytd-browse[page-subtype='home'] ytd-two-column-browse-results-renderer",
    ],
    blockedPageSections: [
      "ytd-watch-flexy #primary",
      "ytd-watch-flexy #secondary",
      "ytd-browse[page-subtype='channels'] #primary",
      "ytd-browse[page-subtype='channels'] #contents",
      "ytd-browse[page-subtype='channels'] #tabs-content",
    ],
  };

  const TEXT_RULES = {
    distractingShelf:
      /\b(trending|explore|news|mix(es)?|recommended|suggested|for you|breaking news|top news|live now|people also watched|watch again|because you watched)\b/i,
    adsAndUpsells: /\b(sponsored|paid promotion|premium|free trial|try premium|upgrade)\b/i,
    donations: /\b(donate|donation|fundraiser|charity|support this creator)\b/i,
    subscriptions: /\bsubscriptions\b/i,
    notifications: /\bnotifications\b/i,
  };

  const CARD_SELECTOR = [
    "ytd-rich-item-renderer",
    "ytd-grid-video-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-playlist-panel-video-renderer",
    "ytd-compact-radio-renderer",
    "ytd-playlist-video-renderer",
    "ytd-rich-grid-media",
  ].join(",");

  const SECTION_SELECTOR = [
    "ytd-rich-section-renderer",
    "ytd-rich-shelf-renderer",
    "ytd-shelf-renderer",
    "ytd-item-section-renderer",
    "ytd-horizontal-card-list-renderer",
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "tp-yt-paper-tab",
  ].join(",");

  const CHANNEL_LINK_SELECTORS = [
    "ytd-channel-name a",
    "#channel-name a",
    "#text-container a[href*='@']",
    "a.yt-simple-endpoint[href^='/@']",
    "a.yt-simple-endpoint[href^='/channel/']",
    "a.yt-simple-endpoint[href^='/c/']",
    "a.yt-simple-endpoint[href^='/user/']",
  ].join(",");

  const PAGE_CHANNEL_SELECTORS = [
    "ytd-watch-metadata ytd-channel-name a",
    "ytd-video-owner-renderer a",
    "#channel-name a",
    "ytd-c4-tabbed-header-renderer yt-formatted-string#channel-handle",
    "meta[itemprop='author']",
  ].join(",");

  const state = {
    settings: { ...DEFAULT_SETTINGS },
    observer: null,
    applyTimer: null,
    historyPatched: false,
    lastUrl: location.href,
    lastBannerMessage: "",
    preparedSearchUrl: null,
  };

  function isEnabled() {
    return Boolean(state.settings.enabled);
  }

  function isHomePage() {
    return location.pathname === "/";
  }

  function isSearchPage() {
    return location.pathname === "/results";
  }

  function isSubscriptionsPage() {
    return location.pathname.startsWith("/feed/subscriptions");
  }

  function normalizeChannelName(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?youtube\.com\//, "")
      .replace(/^\/+/, "")
      .replace(/^@/, "")
      .replace(/^(channel|c|user)\//, "")
      .split(/[/?#]/)[0]
      .replace(/^@/, "")
      .replace(/\s+/g, " ");
  }

  function getListAsSet(key) {
    const list = Array.isArray(state.settings[key]) ? state.settings[key] : [];
    return new Set(list.map(normalizeChannelName).filter(Boolean));
  }

  function collectChannelCandidates(root) {
    if (!root) {
      return [];
    }

    const values = new Set();

    function addValue(rawValue) {
      const normalized = normalizeChannelName(rawValue);
      if (normalized) {
        values.add(normalized);
      }
    }

    if (root.matches?.("a")) {
      addValue(root.textContent);
      addValue(root.getAttribute("href"));
      addValue(root.getAttribute("title"));
    }

    root.querySelectorAll(CHANNEL_LINK_SELECTORS).forEach((node) => {
      addValue(node.textContent);
      addValue(node.getAttribute("href"));
      addValue(node.getAttribute("title"));
    });

    return Array.from(values);
  }

  function getCurrentPageChannelCandidates() {
    const values = new Set();

    function addValue(rawValue) {
      const normalized = normalizeChannelName(rawValue);
      if (normalized) {
        values.add(normalized);
      }
    }

    if (location.pathname.startsWith("/@")) {
      addValue(location.pathname);
    }

    document.querySelectorAll(PAGE_CHANNEL_SELECTORS).forEach((node) => {
      addValue(node.textContent);
      addValue(node.getAttribute?.("href"));
      addValue(node.getAttribute?.("content"));
      addValue(node.getAttribute?.("title"));
    });

    return Array.from(values);
  }

  function matchesChannelList(candidates, listSet) {
    return candidates.some((candidate) => listSet.has(candidate));
  }

  function isCurrentPageBlacklisted() {
    if (!state.settings.blacklistMode) {
      return false;
    }

    const blocked = getListAsSet("blacklist");
    if (!blocked.size) {
      return false;
    }

    return matchesChannelList(getCurrentPageChannelCandidates(), blocked);
  }

  function shouldBypassGeneralFilters() {
    if (!state.settings.whitelistMode || isCurrentPageBlacklisted()) {
      return false;
    }

    const allowed = getListAsSet("whitelist");
    if (!allowed.size) {
      return false;
    }

    return matchesChannelList(getCurrentPageChannelCandidates(), allowed);
  }

  function createCssRule(selectors) {
    return `${selectors.join(",\n")} {\n  display: none !important;\n}\n`;
  }

  function buildStyleSheet(bypassGeneralFilters, searchPageMode) {
    const rules = [
      `[${HIDDEN_ATTRIBUTE}="true"] {\n  display: none !important;\n}\n`,
    ];

    if (!isEnabled() || bypassGeneralFilters || searchPageMode) {
      return rules.join("\n");
    }

    if (state.settings.hideAdsAndUpsells) {
      rules.push(createCssRule(SELECTORS.adsAndUpsells));
    }

    if (state.settings.hideDonations) {
      rules.push(createCssRule(SELECTORS.donations));
    }

    if (state.settings.hideRecommendations) {
      rules.push(createCssRule(SELECTORS.recommendations));
      rules.push(
        [
          "ytd-watch-flexy[is-two-columns_] #primary.ytd-watch-flexy",
          "ytd-watch-flexy[is-two-columns_] #primary",
        ].join(",\n") +
          " {\n  max-width: none !important;\n  min-width: 0 !important;\n  width: 100% !important;\n}\n"
      );
      rules.push(
        "ytd-watch-flexy[is-two-columns_] #columns.ytd-watch-flexy {\n  display: block !important;\n}\n"
      );
    }

    if (state.settings.hideComments) {
      rules.push(createCssRule(SELECTORS.comments));
    }

    if (state.settings.hideLiveChat) {
      rules.push(createCssRule(SELECTORS.liveChat));
    }

    if (state.settings.hideNotificationsBell) {
      rules.push(createCssRule(SELECTORS.notificationsBell));
    }

    if (state.settings.hideSidebarEntirely) {
      rules.push(createCssRule(SELECTORS.sidebar));
      rules.push(
        "ytd-page-manager[guide-persistent-and-visible] #content.ytd-app {\n  margin-left: 0 !important;\n}\n"
      );
    }

    if (state.settings.hideSearchSuggestions) {
      rules.push(createCssRule(SELECTORS.searchSuggestions));
    }

    if (state.settings.hideAutoplayToggle) {
      rules.push(createCssRule(SELECTORS.autoplayToggle));
    }

    if (state.settings.hideMiniplayerButton) {
      rules.push(createCssRule(SELECTORS.miniplayerButton));
    }

    if (state.settings.hideChannelAvatars) {
      rules.push(createCssRule(SELECTORS.channelAvatars));
    }

    if (state.settings.hideSubscriptionsSection) {
      rules.push(createCssRule(SELECTORS.subscriptionsSection));
    }

    return rules.join("\n");
  }

  function ensureStyleElement(cssText) {
    let style = document.getElementById(STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.documentElement.appendChild(style);
    }

    if (style.textContent !== cssText) {
      style.textContent = cssText;
    }
  }

  function markHidden(element, reason) {
    if (!element) {
      return;
    }

    const currentReason = element.getAttribute(APPLIED_ATTRIBUTE);
    if (currentReason === reason) {
      return;
    }

    element.setAttribute(HIDDEN_ATTRIBUTE, "true");
    element.setAttribute(APPLIED_ATTRIBUTE, reason);
  }

  function clearManagedHiding() {
    document.querySelectorAll(`[${APPLIED_ATTRIBUTE}]`).forEach((element) => {
      element.removeAttribute(HIDDEN_ATTRIBUTE);
      element.removeAttribute(APPLIED_ATTRIBUTE);
    });
  }

  function hideAll(selectors, reason) {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        markHidden(element, reason);
      });
    });
  }

  function getTextContent(element) {
    return (element?.textContent || "").replace(/\s+/g, " ").trim();
  }

  const SECTION_TITLE_SELECTORS = [
    "#title",
    "#title-text",
    ".title",
    "h2",
    "yt-formatted-string.title",
    "span#title",
  ].join(",");

  function getSectionTitleText(element) {
    const titleEl = element.querySelector(SECTION_TITLE_SELECTORS);
    return titleEl ? getTextContent(titleEl) : "";
  }

  function hideTextBasedContent(bypassGeneralFilters) {
    if (!isEnabled() || bypassGeneralFilters) {
      return;
    }

    document.querySelectorAll(SECTION_SELECTOR).forEach((element) => {
      const titleText = getSectionTitleText(element);
      if (!titleText) {
        return;
      }

      if (
        state.settings.hideAdsAndUpsells &&
        TEXT_RULES.adsAndUpsells.test(titleText)
      ) {
        markHidden(element, "ads-upsells-text");
        return;
      }

      if (state.settings.hideDonations && TEXT_RULES.donations.test(titleText)) {
        markHidden(element, "donations-text");
        return;
      }

      if (
        state.settings.hideRecommendations &&
        TEXT_RULES.distractingShelf.test(titleText)
      ) {
        markHidden(element, "recommendations-text");
        return;
      }

      if (
        state.settings.hideSubscriptionsSection &&
        TEXT_RULES.subscriptions.test(titleText) &&
        isSubscriptionsPage()
      ) {
        markHidden(element, "subscriptions-text");
        return;
      }

      if (
        state.settings.hideNotificationsBell &&
        TEXT_RULES.notifications.test(titleText)
      ) {
        markHidden(element, "notifications-text");
      }
    });
  }

  function applyChannelBlacklist() {
    let pageBlocked = false;

    if (!state.settings.blacklistMode) {
      return pageBlocked;
    }

    const blocked = getListAsSet("blacklist");
    if (!blocked.size) {
      return pageBlocked;
    }

    document.querySelectorAll(CARD_SELECTOR).forEach((card) => {
      if (matchesChannelList(collectChannelCandidates(card), blocked)) {
        markHidden(card, "blacklisted-channel-card");
      }
    });

    if (matchesChannelList(getCurrentPageChannelCandidates(), blocked)) {
      pageBlocked = true;
      hideAll(SELECTORS.blockedPageSections, "blacklisted-channel-page");
    }

    return pageBlocked;
  }

  function enforceSubscriptionsOnlyHomepage() {
    if (
      !isEnabled() ||
      shouldBypassGeneralFilters() ||
      !state.settings.subscriptionsOnlyHomepage ||
      !isHomePage()
    ) {
      return;
    }

    const target = new URL(location.href);
    target.pathname = "/feed/subscriptions";
    target.search = "";
    target.hash = "";
    location.replace(target.toString());
  }

  function autoSkipAds() {
    if (!isEnabled() || !state.settings.hideAdsAndUpsells) {
      return;
    }

    document
      .querySelectorAll(
        ".ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-overlay-close-button"
      )
      .forEach((button) => button.click());
  }

  function ensureBannerHost() {
    return document.querySelector("ytd-app") || document.body;
  }

  function renderBanner(message) {
    let banner = document.getElementById(BANNER_ID);
    if (!message) {
      state.lastBannerMessage = "";
      banner?.remove();
      return;
    }

    if (banner && state.lastBannerMessage === message) {
      return;
    }

    if (!banner) {
      banner = document.createElement("div");
      banner.id = BANNER_ID;
      banner.style.cssText = [
        "position: relative",
        "z-index: 99999",
        "margin: 16px auto",
        "padding: 14px 16px",
        "max-width: 760px",
        "border: 1px solid rgba(255,255,255,0.14)",
        "border-radius: 16px",
        "background: rgba(15, 15, 15, 0.92)",
        "color: #f1f1f1",
        "font: 500 14px/1.5 Arial, sans-serif",
      ].join(";");
    }

    banner.textContent = message;
    state.lastBannerMessage = message;
    ensureBannerHost().prepend(banner);
  }

  function updateBanner(pageBlocked, bypassGeneralFilters) {
    if (!isEnabled()) {
      renderBanner("");
      return;
    }

    if (pageBlocked) {
      renderBanner(
        "This channel is blacklisted, so its page content is hidden by YouTube Minimal."
      );
      return;
    }

    if (
      !bypassGeneralFilters &&
      state.settings.hideHomeFeedCompletely &&
      isHomePage() &&
      !state.settings.subscriptionsOnlyHomepage
    ) {
      renderBanner(
        "The home feed is hidden. Turn off the homepage filter in the popup if you want it back."
      );
      return;
    }

    if (
      !bypassGeneralFilters &&
      isSubscriptionsPage() &&
      state.settings.hideSubscriptionsSection
    ) {
      renderBanner(
        "Subscriptions are hidden by YouTube Minimal. Turn that toggle off in the popup whenever you want the feed back."
      );
      return;
    }

    renderBanner("");
  }

  function applyDomRules({ resetManagedState = false } = {}) {
    if (resetManagedState) {
      clearManagedHiding();
    }

    const bypassGeneralFilters = shouldBypassGeneralFilters();
    const searchPageMode = isSearchPage();
    ensureStyleElement(
      buildStyleSheet(bypassGeneralFilters, searchPageMode)
    );

    if (!isEnabled()) {
      updateBanner(false, false);
      return;
    }

    if (searchPageMode) {
      renderBanner("");
      return;
    }

    const pageBlocked = applyChannelBlacklist();

    if (!bypassGeneralFilters) {
      if (state.settings.hideAdsAndUpsells) {
        hideAll(SELECTORS.adsAndUpsells, "ads-upsells");
      }

      if (state.settings.hideDonations) {
        hideAll(SELECTORS.donations, "donations");
      }

      if (state.settings.hideRecommendations) {
        hideAll(SELECTORS.recommendations, "recommendations");
      }

      if (state.settings.hideSubscriptionsSection) {
        hideAll(SELECTORS.subscriptionsSection, "subscriptions-section");
      }

      if (state.settings.hideHomeFeedCompletely && isHomePage()) {
        hideAll(SELECTORS.homeFeed, "home-feed-hidden");
      }

      hideTextBasedContent(bypassGeneralFilters);
      autoSkipAds();
    }

    updateBanner(pageBlocked, bypassGeneralFilters);
  }

  function applyAll(reason = "update") {
    const currentUrl = location.href;
    const urlChanged = state.lastUrl !== currentUrl;
    state.lastUrl = currentUrl;

    if (isSearchPage()) {
      const shouldSyncSearchPage =
        reason === "init" ||
        reason === "settings" ||
        urlChanged ||
        state.preparedSearchUrl !== currentUrl;

      if (shouldSyncSearchPage) {
        clearManagedHiding();
        ensureStyleElement("");
        renderBanner("");
        state.preparedSearchUrl = currentUrl;
      }

      return;
    }

    state.preparedSearchUrl = null;
    const resetManagedState =
      reason === "init" ||
      reason === "settings" ||
      urlChanged;

    enforceSubscriptionsOnlyHomepage();
    applyDomRules({ resetManagedState });

    if (urlChanged && reason !== "mutation") {
      window.dispatchEvent(
        new CustomEvent("yt-minimal:page-updated", {
          detail: { url: location.href },
        })
      );
    }
  }

  function scheduleApply(reason = "mutation") {
    window.clearTimeout(state.applyTimer);
    state.applyTimer = window.setTimeout(() => applyAll(reason), 60);
  }

  function isManagedNode(node) {
    if (!node || node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    return (
      node.id === STYLE_ID ||
      node.id === BANNER_ID ||
      node.closest?.(`#${BANNER_ID}`) ||
      node.closest?.(`#${STYLE_ID}`)
    );
  }

  function observePage() {
    if (state.observer) {
      return;
    }

    state.observer = new MutationObserver((mutations) => {
      if (isSearchPage()) {
        return;
      }

      const hasRelevantMutation = mutations.some((mutation) => {
        if (!isManagedNode(mutation.target)) {
          return true;
        }

        const addedRelevantNode = Array.from(mutation.addedNodes || []).some(
          (node) => !isManagedNode(node)
        );
        const removedRelevantNode = Array.from(mutation.removedNodes || []).some(
          (node) => !isManagedNode(node)
        );

        return addedRelevantNode || removedRelevantNode;
      });

      if (hasRelevantMutation) {
        scheduleApply("mutation");
      }
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function patchHistoryNavigation() {
    if (state.historyPatched) {
      return;
    }

    state.historyPatched = true;

    ["pushState", "replaceState"].forEach((method) => {
      const original = history[method];
      history[method] = function patchedHistoryState(...args) {
        const previousUrl = location.href;
        const result = original.apply(this, args);
        if (location.href !== previousUrl) {
          scheduleApply("history");
        }
        return result;
      };
    });
  }

  function setupNavigationListeners() {
    patchHistoryNavigation();
    observePage();

    ["popstate", "yt-navigate-finish", "yt-page-data-updated"].forEach(
      (eventName) => {
        window.addEventListener(eventName, () => {
          if (isSearchPage() && eventName === "yt-page-data-updated") {
            return;
          }

          scheduleApply(eventName);
        });
      }
    );
  }

  async function init() {
    state.settings = await settingsApi.getSettings();
    setupNavigationListeners();
    settingsApi.onSettingsChanged((nextSettings) => {
      state.settings = { ...DEFAULT_SETTINGS, ...nextSettings };
      scheduleApply("settings");
    });
    applyAll("init");
  }

  init().catch((error) => {
    console.error("YouTube Minimal failed to initialize:", error);
  });
})();
