# Source provenance

This Chrome extension was imported from `mbkurt06/german-language-extension`.

- Source commit: `121c731a0c1f0b459cd1e6d11ec79cc38ae7bd47`
- Destination: `apps/extension`
- Migration scope: preserve the working extension and its existing YouTube cue unit tests before Platform API integration.

The direct German Engine calls and `chrome.storage.sync` learning-state persistence are intentionally preserved during this migration. They will be replaced in a follow-up Platform API integration change so that code movement and behavior changes remain reviewable separately.
