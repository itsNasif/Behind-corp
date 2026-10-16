export async function configureRealm(api) {
  const executions = await api("authentication/flows/browser/executions");
  const recovery = executions.find(
    (x) => x.providerId === "auth-recovery-authn-code-form",
  );
  if (!recovery)
    throw new Error("Pinned Keycloak recovery authenticator not found");
  await api("authentication/flows/browser/executions", "PUT", {
    ...recovery,
    requirement: "ALTERNATIVE",
  });
  const actions = await api("authentication/required-actions");
  let action = actions.find(
    (x) => x.providerId === "CONFIGURE_RECOVERY_AUTHN_CODES",
  );
  if (!action) {
    await api("authentication/register-required-action", "POST", {
      providerId: "CONFIGURE_RECOVERY_AUTHN_CODES",
      name: "Recovery authentication codes",
    });
    action = (await api("authentication/required-actions")).find(
      (x) => x.providerId === "CONFIGURE_RECOVERY_AUTHN_CODES",
    );
  }
  await api(`authentication/required-actions/${action.alias}`, "PUT", {
    ...action,
    enabled: true,
    defaultAction: false,
  });
  // Allow self-service deletion through Keycloak's supported required action.
  const account = (await api("clients?clientId=account"))[0];
  const deletion = await api(`clients/${account.id}/roles/delete-account`);
  const defaultRole = await api("roles/default-roles-behind");
  await api(`roles-by-id/${defaultRole.id}/composites`, "POST", [deletion]);
  console.log(
    "Recovery-code login enabled; self-service identity deletion enabled. MFA enrollment is required for every new user.",
  );

  const basic = (await api("client-scopes")).find((s) => s.name === "basic");
  if (!basic) throw new Error("Keycloak basic scope required");
  for (const client of (await api("clients")).filter((c) =>
    ["behind-web", "behind-app-a", "behind-app-b"].includes(c.clientId),
  ))
    await api(`clients/${client.id}/default-client-scopes/${basic.id}`, "PUT");
  console.log("Basic subject scope attached to each app client.");

  const emailAction = (await api("authentication/required-actions")).find(
    (a) => a.providerId === "UPDATE_EMAIL",
  );
  if (emailAction)
    await api(`authentication/required-actions/${emailAction.alias}`, "PUT", {
      ...emailAction,
      enabled: true,
    });
  else
    await api("authentication/register-required-action", "POST", {
      providerId: "UPDATE_EMAIL",
      name: "Update Email",
    });
  await api("", "PUT", { accountTheme: "behind" });

  const twoFactor = executions.find(
    (x) => x.displayName === "Browser - Conditional 2FA",
  );
  if (!twoFactor) throw new Error("Pinned MFA subflow missing");
  await api("authentication/flows/browser/executions", "PUT", {
    ...twoFactor,
    requirement: "REQUIRED",
  });
  const otpIndex = executions.findIndex((x) => x.id === twoFactor.id);
  for (const entry of executions
    .slice(otpIndex + 1)
    .filter((x) => x.providerId?.startsWith("conditional-")))
    await api("authentication/flows/browser/executions", "PUT", {
      ...entry,
      requirement: "DISABLED",
    });
  console.log(
    "Second factor subflow is required, with OTP and recovery alternatives.",
  );

  // Email recovery must not silently reset MFA or authenticate a password-only user.
  const resetFlow = "behind-reset-credentials";
  if (!(await api("authentication/flows")).some((x) => x.alias === resetFlow))
    await api("authentication/flows/reset%20credentials/copy", "POST", {
      newName: resetFlow,
    });
  await api("", "PUT", { resetCredentialsFlow: resetFlow });
  const resetExecutions = await api(
    `authentication/flows/${resetFlow}/executions`,
  );
  const resetOtp = resetExecutions.find(
    (x) => x.displayName === "Reset - Conditional OTP",
  );
  if (resetOtp)
    await api(`authentication/flows/${resetFlow}/executions`, "PUT", {
      ...resetOtp,
      requirement: "DISABLED",
    });
  const recoveryFlow = "behind-reset-second-factor";
  if (!resetExecutions.some((x) => x.displayName === recoveryFlow)) {
    await api(`authentication/flows/${resetFlow}/executions/flow`, "POST", {
      alias: recoveryFlow,
      type: "basic-flow",
      provider: "basic-flow",
      description: "Require an existing second factor for password recovery",
    });
    for (const provider of ["auth-otp-form", "auth-recovery-authn-code-form"])
      await api(
        `authentication/flows/${recoveryFlow}/executions/execution`,
        "POST",
        { provider },
      );
  }
  const resetSubflow = (
    await api(`authentication/flows/${resetFlow}/executions`)
  ).find((x) => x.displayName === recoveryFlow);
  await api(`authentication/flows/${resetFlow}/executions`, "PUT", {
    ...resetSubflow,
    requirement: "REQUIRED",
  });
  for (const execution of await api(
    `authentication/flows/${recoveryFlow}/executions`,
  ))
    await api(`authentication/flows/${recoveryFlow}/executions`, "PUT", {
      ...execution,
      requirement: "ALTERNATIVE",
    });
  console.log(
    "Password recovery preserves MFA and requires an existing second factor.",
  );

  for (const client of (await api("clients")).filter((c) =>
    ["behind-web", "behind-app-a", "behind-app-b"].includes(c.clientId),
  )) {
    await api(`clients/${client.id}`, "PUT", { fullScopeAllowed: false });
    if (client.clientId === "behind-web") {
      const role = await api(`clients/${client.id}/roles/inquiry-admin`);
      await api(
        `clients/${client.id}/scope-mappings/clients/${client.id}`,
        "POST",
        [role],
      );
    }
  }
}
