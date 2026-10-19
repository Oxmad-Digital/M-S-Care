// Les noms de la gamme s'écrivent toujours avec un « C » majuscule à « Care » :
// AmdiCare, AldaCare, KofCarePhyto… Seul « care » collé à un préfixe est concerné.
export function formatProductName(name: string): string {
  return name.replace(/(\p{L})care/giu, "$1Care");
}
