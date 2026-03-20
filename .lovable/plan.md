

## Add Marketplace Selector to Quick Download Section

### What we're building
A dropdown selector next to the "Quick Download" header that lets users pick their Amazon marketplace (US, UK, DE, CA, IN, JP, etc.). The download URLs will dynamically swap domains based on the selected marketplace.

### Marketplace domain mapping

| Marketplace | Seller Central domain | Advertising domain |
|---|---|---|
| US | sellercentral.amazon.com | advertising.amazon.com |
| UK | sellercentral.amazon.co.uk | advertising.amazon.co.uk |
| DE | sellercentral.amazon.de | advertising.amazon.de |
| FR | sellercentral.amazon.fr | advertising.amazon.fr |
| ES | sellercentral.amazon.es | advertising.amazon.es |
| IT | sellercentral.amazon.it | advertising.amazon.it |
| CA | sellercentral.amazon.ca | advertising.amazon.ca |
| MX | sellercentral.amazon.com.mx | advertising.amazon.com.mx |
| IN | sellercentral.amazon.in | advertising.amazon.in |
| JP | sellercentral.amazon.co.jp | advertising.amazon.co.jp |
| AU | sellercentral.amazon.com.au | advertising.amazon.com.au |
| AE | sellercentral.amazon.ae | advertising.amazon.ae |
| BR | sellercentral.amazon.com.br | advertising.amazon.com.br |

### Changes to `src/pages/Index.tsx`

1. **Add marketplace state**: `const [marketplace, setMarketplace] = useState('US')`

2. **Define marketplace config** as a constant object mapping marketplace codes to their `sellerCentral` and `advertising` base domains.

3. **Rebuild `downloadUrls`** dynamically using the selected marketplace's domains. The URL paths stay the same — only the domain portion changes (e.g., `sellercentral.amazon.com` becomes `sellercentral.amazon.co.uk`).

4. **Add a `Select` dropdown** (using the existing `@/components/ui/select` component) in the header row between the title and the "Open All Tabs" button, showing country flags (emoji) + marketplace code (e.g., "🇺🇸 US", "🇬🇧 UK").

### UI Layout

```text
Quick Download from Seller Central   [🇺🇸 US ▾]   [Open All Tabs]
```

### Technical notes
- No backend changes needed
- Marketplace preference stored in component state only (resets on reload)

