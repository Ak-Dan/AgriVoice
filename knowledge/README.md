# AgriVoice RAG Knowledge Corpus

This folder contains seed markdown documents for the AgriVoice agronomist RAG layer.

Each file starts with YAML-style metadata so retrieval can filter by crop, disease, country focus, source, and document type. The body is a short, farmer-safe summary derived from trusted sources; it does not copy full source documents into the repository.

## Current Sources

- KALRO / Kenya agricultural extension and repository materials.
- IITA cassava IPM and cassava disease materials.
- CGIAR/IITA cassava research records.
- CIMMYT / KALRO maize lethal necrosis material.

## Retrieval Use

At inference time, map a model label to crop and disease keywords, then retrieve matching files from:

```text
knowledge/disease_guides/
```

Example:

```text
Corn_(maize)___Common_rust_ -> crop: maize, disease: common rust
Tomato___Late_blight -> crop: tomato, disease: late blight
```

The response layer should cite the `source_name` and `source_url` fields and should not add treatment advice beyond the retrieved content.
