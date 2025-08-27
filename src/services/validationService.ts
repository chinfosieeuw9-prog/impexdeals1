// Placeholder for future server-side validation.
// Simulates a backend call with latency and returns an array of error messages.
export interface ProductDraft {
  title: string;
  description: string;
  price: number;
  qty: number;
  imagesCount: number;
  category?: string;
  condition?: string;
  tags?: string[];
  isDraft?: boolean;
  externalLink?: string;
}

const BANNED_WORDS = ['verboden','illegaal'];

export async function validateProductDraft(d: ProductDraft): Promise<string[]> {
  return new Promise(resolve => {
    setTimeout(()=>{
      const errors: string[] = [];
      const minPricePerCategory: Record<string, number> = {
        Elektronica: 50,
        Kleding: 20,
        Huishoud: 15,
        Speelgoed: 10,
        Schoenen: 25,
        Beauty: 5,
        Sport: 30
      };
      if (!d.title || d.title.trim().length < 5) errors.push('Titel minimaal 5 tekens.');
      if (d.title.length > 120) errors.push('Titel maximaal 120 tekens.');
      if (!d.description || d.description.trim().length < 20) errors.push('Beschrijving minimaal 20 tekens.');
      if (d.description.length > 5000) errors.push('Beschrijving maximaal 5000 tekens.');
  if (isNaN(d.price) || d.price <= 0) errors.push('Prijs moet > 0.');
  const catMin = d.category ? minPricePerCategory[d.category] : undefined;
  if (catMin !== undefined && d.price < catMin) errors.push(`Minimale prijs voor ${d.category} is €${catMin}.`);
      if (d.qty <= 0) errors.push('Aantal moet > 0.');
      if (!d.isDraft && d.imagesCount === 0) errors.push('Minstens 1 afbeelding vereist om te publiceren.');
      if (d.imagesCount > 4) errors.push('Maximaal 4 afbeeldingen.');
      if (d.externalLink && d.externalLink.length > 0) {
        const url = d.externalLink.trim();
        const pattern = /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+(\/[^\s]*)?$/i;
        if (!pattern.test(url)) errors.push('Externe link ongeldig (moet met http(s):// beginnen).');
      }
      BANNED_WORDS.forEach(w => { if (d.title.toLowerCase().includes(w) || d.description.toLowerCase().includes(w)) errors.push(`Woord verboden: "${w}"`); });
      resolve(errors);
    }, 450); // simulate latency
  });
}
