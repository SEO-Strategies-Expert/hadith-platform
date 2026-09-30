import {
  formulaForCertificate,
  formulaParagraphs,
  formatCertificateDates,
  normalizeCertificateFormulaData,
  type CertificateFormulaId,
} from "@/lib/certificate-formulas";

export type CertificateSignature = { src?: string | null; name?: string | null; role: string };

export function OfficialCertificate({
  formulaId,
  kind,
  holder,
  subject,
  extra,
  granter,
  issuedAt,
  serial,
  verifyCode,
  signatures,
  formulaData,
}: {
  formulaId?: string | null;
  kind?: string | null;
  holder: string;
  subject?: string | null;
  extra?: string | null;
  granter?: string | null;
  issuedAt?: Date | string | null;
  serial?: string | null;
  verifyCode?: string | null;
  signatures?: CertificateSignature[];
  formulaData?: unknown;
}) {
  const formula = formulaForCertificate(formulaId, kind);
  const dates = formatCertificateDates(issuedAt);
  const paragraphs = formulaParagraphs(formula.id as CertificateFormulaId, {
    name: holder,
    subject: subject ?? "",
    extra: extra ?? "",
    granter: granter ?? "",
    date: dates.date,
    hijri: dates.hijri,
    data: normalizeCertificateFormulaData(formulaData),
  });
  const signers: CertificateSignature[] = (signatures?.length ? signatures : formula.signers.map((signer) => ({
    role: signer.role,
    src: null,
    name: "nameFrom" in signer && signer.nameFrom === "granter" ? granter : "",
  }))).slice(0, 3);

  return (
    <div className="ocert" dir="rtl" data-formula={formula.id}>
      <style>{`
        .ocert{position:relative;width:100%;aspect-ratio:1638/1158;background:#fff url("/assets/img/certificate-frame.png") center/100% 100% no-repeat;color:#3c4748;container-type:inline-size}
        .ocert-copy{position:absolute;top:35%;right:12%;left:12%;bottom:16%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;z-index:1;overflow:hidden}
        .ocert-title{margin:0 0 .45em;font-family:'NaskhQ','ThuluthAlt',serif;font-size:2.05cqw;line-height:1.25;font-weight:700;color:#123159}
        .ocert-copy p{margin:0 0 .26em;font-family:'PlexAr','NaskhQ','Segoe UI',sans-serif;font-size:1.04cqw;line-height:1.42;font-weight:650}
        .ocert[data-formula="ijaza"] .ocert-copy p,.ocert[data-formula="master"] .ocert-copy p{font-size:.91cqw;line-height:1.32}
        .ocert-signs{display:flex;justify-content:space-around;align-items:flex-end;gap:1.2cqw;width:100%;margin-top:auto;padding-top:.4em}
        .ocert-sign{flex:1;min-width:0;font-size:1.12cqw;font-weight:800;color:#123159}
        .ocert-sign img{display:block;height:3.2cqw;max-width:100%;margin:0 auto .15em;object-fit:contain}
        .ocert-sign small{display:block;margin-top:.1em;font-size:.9em;font-weight:600;color:#5c6868}
        .ocert-meta{margin-top:.25em;font-size:.82cqw;letter-spacing:.04em;color:#6a7474}
        @media(max-width:640px){.ocert-copy{top:34%;right:11%;left:11%;bottom:14%}.ocert-title{font-size:2.3cqw}.ocert-copy p{font-size:1.12cqw;line-height:1.3}.ocert-sign{font-size:1.2cqw}}
      `}</style>
      <div className="ocert-copy">
        <h2 className="ocert-title">{formula.titleAr}</h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <div className="ocert-signs">
          {signers.map((signer) => (
            <div key={signer.role} className="ocert-sign">
              {signer.src ? <img src={signer.src} alt="" /> : null}
              <div>{signer.role}</div>
              {signer.name ? <small>{signer.name}</small> : <small>التوقيع والختم</small>}
            </div>
          ))}
        </div>
        {(serial || verifyCode) && (
          <div className="ocert-meta" dir="ltr">
            {serial ? <span>{serial}</span> : null}
            {serial && verifyCode ? " · " : null}
            {verifyCode ? <span>{verifyCode}</span> : null}
          </div>
        )}
      </div>
    </div>
  );
}
