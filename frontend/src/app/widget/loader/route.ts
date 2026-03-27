export const dynamic = "force-dynamic";

export function GET() {
  const script = `
(function () {
  if (window.__conversaWidgetLoaded) {
    return;
  }

  window.__conversaWidgetLoaded = true;
  var config = window.ConversaStudioWidgetConfig || {};
  var deploymentKey = config.deploymentKey;
  var apiBaseUrl = config.apiBaseUrl;
  var clientBaseUrl = config.clientBaseUrl || window.location.origin;
  var launcherLabel = config.launcherLabel || "Chat";
  var themeColor = config.themeColor || "#2563EB";

  if (!deploymentKey || !apiBaseUrl || !clientBaseUrl) {
    console.error("Conversa widget is missing required configuration.");
    return;
  }

  var button = document.createElement("button");
  button.type = "button";
  button.textContent = launcherLabel;
  button.setAttribute("aria-label", launcherLabel);
  button.style.position = "fixed";
  button.style.right = "24px";
  button.style.bottom = "24px";
  button.style.zIndex = "2147483646";
  button.style.padding = "14px 18px";
  button.style.borderRadius = "999px";
  button.style.border = "none";
  button.style.cursor = "pointer";
  button.style.boxShadow = "0 18px 42px rgba(15,23,42,0.24)";
  button.style.background = themeColor;
  button.style.color = "#ffffff";
  button.style.font = "600 14px system-ui, sans-serif";

  var iframe = document.createElement("iframe");
  iframe.title = launcherLabel;
  iframe.style.position = "fixed";
  iframe.style.right = "24px";
  iframe.style.bottom = "84px";
  iframe.style.width = "380px";
  iframe.style.height = "640px";
  iframe.style.maxWidth = "calc(100vw - 24px)";
  iframe.style.maxHeight = "calc(100vh - 108px)";
  iframe.style.border = "none";
  iframe.style.borderRadius = "18px";
  iframe.style.boxShadow = "0 24px 60px rgba(15,23,42,0.22)";
  iframe.style.background = "#ffffff";
  iframe.style.zIndex = "2147483645";
  iframe.style.display = "none";
  iframe.allow = "clipboard-write";

  var iframeUrl = new URL(clientBaseUrl.replace(/\\/$/, "") + "/widget/embed");
  iframeUrl.searchParams.set("deploymentKey", deploymentKey);
  iframeUrl.searchParams.set("apiBaseUrl", apiBaseUrl);
  iframeUrl.searchParams.set("parentOrigin", window.location.origin);
  iframe.src = iframeUrl.toString();

  button.addEventListener("click", function () {
    iframe.style.display = iframe.style.display === "none" ? "block" : "none";
  });

  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "conversa-widget-close") {
      iframe.style.display = "none";
    }
  });

  document.body.appendChild(iframe);
  document.body.appendChild(button);
})();`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
