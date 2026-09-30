import {
  formulaForCertificate,
  formulaParagraphs,
  formatCertificateDates,
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
  });
  const signers = (signatures?.length ? signatures : formula.signers.map((signer) => ({
    role: signer.role,
    name: "nameFrom" in signer && signer.nameFrom === "granter" ? granter : "",
  }))).slice(0, 3);

  return (
    <div className="ocert" dir="rtl">
      <style>{`
        .ocert{position:relative;width:100%;aspect-ratio:1638/1158;background:#fff url("/assets/img/certificate-frame.png") center/100% 100% no-repeat;color:#3c4748;container-type:inline-size}
        .ocert-copy{position:absolute;top:32%;right:13%;left:13%;bottom:14.5%;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;text-align:center;z-index:1;overflow:hidden}
        .ocert-title{margin:0 0 .2em;font-family:'Thuluth','ThuluthAlt','NaskhQ',serif;font-size:2.5cqw;line-height:1.25;font-weight:400;color:#123159}
        .ocert-copy p{margin:0 0 .28em;font-family:'PlexAr','NaskhQ','Segoe UI',sans-serif;font-size:1.18cqw;line-height:1.55;font-weight:650}
        .ocert-signs{display:flex;justify-content:space-between;gap:1.2cqw;width:100%;margin-top:auto;padding-top:.6em}
        .ocert-sign{flex:1;min-width:0;font-size:1.25cqw;font-weight:800;color:#123159}
        .ocert-sign img{display:block;height:4.2cqw;max-width:100%;margin:0 auto .2em;object-fit:contain}
        .ocert-sign small{display:block;margin-top:.15em;font-weight:600;color:#5c6868}
        .ocert-meta{margin-top:.45em;font-size:1.05cqw;letter-spacing:.04em;color:#6a7474}
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
