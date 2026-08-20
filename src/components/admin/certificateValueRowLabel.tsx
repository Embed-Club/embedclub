"use client";

import { useRowLabel } from "@payloadcms/ui";

/** Shows each member-set value as marker → value, so collapsed rows read. */
const CertificateValueRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{ key?: string; value?: string }>();

  if (!data?.key)
    return (
      <span>{`Value ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`}</span>
    );

  return (
    <span>
      {`{{${data.key}}}`}
      {data.value ? ` → ${data.value}` : ""}
    </span>
  );
};

export default CertificateValueRowLabel;
