// Variant names for display (DESIGN-4 4.16): a plain name first, the regulator's suffix second.
// NRCan tells some variants apart with a letter code on the end ("Long Range AWD-B", "Premium-I"),
// sometimes followed by a note in brackets ("(pre-6/11/25)"). The data keeps the full name; this
// only splits it for the screen, so the code can be shown as smaller secondary text.

export interface VariantNameParts {
  /** The name a driver would recognise ("Long Range AWD"). */
  plain: string;
  /** The regulator's code and any note after it ("-B (pre-6/11/25)"), or '' when there is none. */
  suffix: string;
}

// The letter codes NRCan adds (seen on Tesla variants). A fixed set, not "any capital":
// "LYRIQ-V" is a real trim name.
const CODE = /^(.+?)(-[BI](?:\s+\(.+\))?)$/;

export function splitVariantName(name: string): VariantNameParts {
  const m = CODE.exec(name.trim());
  return m ? { plain: m[1], suffix: m[2] } : { plain: name.trim(), suffix: '' };
}
