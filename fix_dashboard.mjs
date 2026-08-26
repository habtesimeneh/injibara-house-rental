import { readFileSync, writeFileSync } from 'fs';
const path = 'client/src/pages/Dashboard.jsx';
let content = readFileSync(path, 'utf8');

const startMarker = '                      <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">';
const endMarker = '                      </div>';

const startIdx = content.indexOf(startMarker);
if (startIdx === -1) {
  console.log('Start marker not found');
  process.exit(1);
}

// Find the matching end marker after startIdx
const afterStart = content.indexOf(endMarker, startIdx + startMarker.length);
if (afterStart === -1) {
  console.log('End marker not found');
  process.exit(1);
}

const endIdx = afterStart + endMarker.length;

const newBlock = `                      <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-3">
                        {tenantPaymentMethod && payConfig.payments && (() => {
                          const selectedKey = Object.keys(payConfig.payments).find(
                            (key) => {
                              const label =
                                key === "telebirr"
                                  ? "Telebirr"
                                  : key === "cbe"
                                    ? "CBE"
                                    : key === "abyssinia"
                                      ? "Abyssinia"
                                      : key === "mpesa"
                                        ? "M-Pesa"
                                        : key === "amhara"
                                          ? "Amhara"
                                          : key;
                              return label === tenantPaymentMethod;
                            }
                          );

                          if (!selectedKey) {
                            return (
                              <p className="text-slate-400 text-center py-2">
                                {language === "am"
                                  ? "እባክዎን የክፍያ ዘዴ ይምረጡ"
                                  : "Please select a payment method above"}
                              </p>
                            );
                          }

                          const payment = payConfig.payments[selectedKey];
                          const accountValue = payment.account || payment.phone || "";
                          const accountName = payment.name || "";
                          const valueLabel =
                            selectedKey === "telebirr"
                              ? language === "am"
                                ? "የስልክ ቁጥር"
                                : "Phone Number"
                              : language === "am"
                                ? "የሂሳብ ቁጥር"
                                : "Account Number";

                          return (
                            <>
                              <p className="text-slate-400 font-semibold">
                                {valueLabel}:
                              </p>
                              <p className="text-amber-400 font-mono font-bold text-sm">
                                {accountValue}
                              </p>
                              <p className="text-slate-400 font-semibold">
                                {language === "am" ? "የሂሳብ ስም" : "Account Name"}:
                              </p>
                              <p className="text-slate-200">{accountName}</p>
                            </>
                          );
                        })()}
                      </div>`;

content = content.slice(0, startIdx) + newBlock + content.slice(endIdx);
writeFileSync(path, content, 'utf8');
console.log('Replacement successful');
