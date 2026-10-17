# Homey settings design template

The shared design guide and reusable CSS are included here for review and reuse:

- [Design guide](HOMEY_DESIGN_TEMPLATE.md)
- [Reusable template CSS](homey-settings-design-template.css)

House Guard keeps its existing settings markup and loads its app-specific color
rules from [`settings/color-hierarchy.css`](../../settings/color-hierarchy.css).
The standalone mobile theme is enabled before the styles load by
[`settings/theme.js`](../../settings/theme.js). Homey's embedded iframe is left
to Homey so its own dark-mode inversion continues to work.
