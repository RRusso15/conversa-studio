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
  var launcherLabel = config.launcherLabel || "Start conversation";
  var themeColor = config.themeColor || "#2563EB";
  var currentScript = document.currentScript;
  var resolvedClientBaseUrl = currentScript && currentScript.src
    ? new URL(currentScript.src).origin
    : window.location.origin;

  if (!deploymentKey || !resolvedClientBaseUrl) {
    console.error("Conversa widget is missing required configuration.");
    return;
  }

  var style = document.createElement("style");
  style.textContent = [
    ".conversa-widget-launcher {",
    "  position: fixed;",
    "  right: 24px;",
    "  bottom: 24px;",
    "  z-index: 2147483646;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  gap: 10px;",
    "  min-width: 58px;",
    "  max-width: min(320px, calc(100vw - 32px));",
    "  height: 58px;",
    "  padding: 0 18px;",
    "  border: none;",
    "  border-radius: 999px;",
    "  cursor: pointer;",
    "  color: #ffffff;",
    "  font: 600 14px/1.1 system-ui, sans-serif;",
    "  letter-spacing: 0.01em;",
    "  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.26);",
    "  background: linear-gradient(135deg, " + themeColor + " 0%, #0f172a 100%);",
    "  transition: transform 180ms ease, width 220ms ease, max-width 220ms ease, padding 220ms ease, border-radius 220ms ease, box-shadow 180ms ease, opacity 180ms ease;",
    "}",
    ".conversa-widget-launcher:hover {",
    "  transform: translateY(-1px) scale(1.01);",
    "  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.3);",
    "}",
    ".conversa-widget-launcher:active {",
    "  transform: scale(0.98);",
    "}",
    ".conversa-widget-launcher[data-open='true'] {",
    "  width: 58px;",
    "  padding: 0;",
    "  border-radius: 50%;",
    "}",
    ".conversa-widget-launcher__icon {",
    "  flex: 0 0 auto;",
    "  width: 20px;",
    "  height: 20px;",
    "  display: inline-flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "}",
    ".conversa-widget-launcher__icon svg {",
    "  width: 20px;",
    "  height: 20px;",
    "  fill: currentColor;",
    "}",
    ".conversa-widget-launcher__label {",
    "  display: inline-block;",
    "  overflow: hidden;",
    "  text-overflow: ellipsis;",
    "  white-space: nowrap;",
    "  transition: opacity 180ms ease, max-width 220ms ease, transform 180ms ease;",
    "  max-width: 220px;",
    "}",
    ".conversa-widget-launcher[data-open='true'] .conversa-widget-launcher__label {",
    "  opacity: 0;",
    "  max-width: 0;",
    "  transform: translateX(6px);",
    "}",
    ".conversa-widget-frame {",
    "  position: fixed;",
    "  right: 24px;",
    "  bottom: 94px;",
    "  width: 380px;",
    "  height: 640px;",
    "  max-width: calc(100vw - 24px);",
    "  max-height: calc(100vh - 118px);",
    "  border: none;",
    "  border-radius: 20px;",
    "  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.22);",
    "  background: #ffffff;",
    "  z-index: 2147483645;",
    "  opacity: 0;",
    "  visibility: hidden;",
    "  pointer-events: none;",
    "  transform: translateY(18px) scale(0.97);",
    "  transform-origin: bottom right;",
    "  transition: opacity 220ms ease, transform 220ms ease, visibility 220ms ease;",
    "}",
    ".conversa-widget-frame[data-open='true'] {",
    "  opacity: 1;",
    "  visibility: visible;",
    "  pointer-events: auto;",
    "  transform: translateY(0) scale(1);",
    "}",
    "@media (max-width: 640px) {",
    "  .conversa-widget-launcher {",
    "    right: 16px;",
    "    bottom: 16px;",
    "    max-width: calc(100vw - 24px);",
    "  }",
    "  .conversa-widget-frame {",
    "    right: 12px;",
    "    bottom: 86px;",
    "    width: calc(100vw - 24px);",
    "    height: min(76vh, 640px);",
    "    max-height: calc(100vh - 112px);",
    "  }",
    "}"
  ].join("\\n");
  document.head.appendChild(style);

  var button = document.createElement("button");
  button.type = "button";
  button.className = "conversa-widget-launcher";
  button.setAttribute("aria-label", launcherLabel);
  button.setAttribute("data-open", "false");

  var icon = document.createElement("span");
  icon.className = "conversa-widget-launcher__icon";
  icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.477 3 2 6.94 2 11.8c0 2.683 1.367 5.083 3.52 6.695V22l3.224-1.786c1.013.255 2.102.386 3.256.386 5.523 0 10-3.94 10-8.8S17.523 3 12 3zm-4.5 8.9a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2zm4.5 0a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2zm4.5 0a1.1 1.1 0 110-2.2 1.1 1.1 0 010 2.2z"></path></svg>';

  var label = document.createElement("span");
  label.className = "conversa-widget-launcher__label";
  label.textContent = launcherLabel;

  button.appendChild(icon);
  button.appendChild(label);

  var iframe = document.createElement("iframe");
  iframe.title = launcherLabel;
  iframe.className = "conversa-widget-frame";
  iframe.setAttribute("data-open", "false");
  iframe.allow = "clipboard-write";

  var iframeUrl = new URL(resolvedClientBaseUrl.replace(/\\/$/, "") + "/widget/embed");
  iframeUrl.searchParams.set("deploymentKey", deploymentKey);
  iframeUrl.searchParams.set("parentOrigin", window.location.origin);
  iframe.src = iframeUrl.toString();

  function setOpenState(nextIsOpen) {
    button.setAttribute("data-open", nextIsOpen ? "true" : "false");
    iframe.setAttribute("data-open", nextIsOpen ? "true" : "false");
    button.setAttribute("aria-label", nextIsOpen ? "Minimize chat" : launcherLabel);
  }

  button.addEventListener("click", function () {
    setOpenState(iframe.getAttribute("data-open") !== "true");
  });

  window.addEventListener("message", function (event) {
    if (event.data && event.data.type === "conversa-widget-close") {
      setOpenState(false);
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
