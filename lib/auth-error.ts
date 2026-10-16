/** Static, accessible error document. Never interpolate provider errors or URLs. */
export function authFailureResponse(status: number) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Sign-in unavailable — behind</title><style>body{margin:0;background:#0b0b0b;color:#fff;font:16px/1.7 Arial,sans-serif}main{max-width:640px;margin:auto;padding:12vh 7%}a{color:inherit;text-underline-offset:5px}a:focus-visible{outline:2px solid #fff;outline-offset:6px}.brand{font-size:36px;letter-spacing:-2px;text-decoration:none}h1{font-size:clamp(38px,7vw,65px);line-height:1.08;letter-spacing:-3px;font-weight:500;margin-top:65px}p{color:#bbb}nav{display:flex;gap:30px;flex-wrap:wrap;margin-top:35px}</style></head><body><main><a class="brand" href="/">behind.</a><h1>Let’s try that again.</h1><p>We couldn’t complete sign-in. The request may have expired, been used already, or could not be verified. If the service is unavailable, try again shortly.</p><nav aria-label="Sign-in recovery"><a href="/auth/login">Start a new sign-in →</a><a href="/">Back to behind →</a></nav></main></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
