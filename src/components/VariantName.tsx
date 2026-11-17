// A variant name for the screen (DESIGN-4 4.16): the plain name first, the regulator's code
// ("-B (pre-6/11/25)") as small muted text after it. The full name stays in the text, so
// screen readers and copy-paste still get it whole.

import { splitVariantName } from '../lib/variant-name.ts';

export default function VariantName({ name }: { name: string }) {
  const { plain, suffix } = splitVariantName(name);
  if (!suffix) return <>{name}</>;
  return (
    <>
      {plain}
      <span className="variant-suffix">{suffix}</span>
    </>
  );
}
