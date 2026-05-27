export type Disease = "healthy" | "greyLeaf" | "rust" | "blight"

export function getDiseaseName(disease: Disease) {
    switch (disease) {
        case "healthy":
            return "healthy"
        case "rust":
            return "common rust"
        case "greyLeaf":
            return "greyleaf spot"
        case "blight":
            return "northern leafblight"
        default:
         throw new Error("Undefined disease detected")
    }
}

// TODO: Sync this with the pdf information
export function getDiseaseTreatment(disease: Disease) {
         switch (disease) {
        case "healthy":
            return "healthy"
        case "rust":
            return "healthy"
        case "greyLeaf":
            return "healthy"
        case "blight":
            return "healthy"
        default:
         throw new Error("Undefined disease detected")
    }
}
