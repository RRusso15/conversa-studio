"use client";

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

interface IHandoffEmailInput {
    recipientEmail: string;
    recipientLabel: string;
    contactEmail: string;
    botName: string;
    deploymentKey: string;
    sessionId: string;
    transcript: string;
    variables: Record<string, string>;
}

/**
 * Sends a handoff email through the EmailJS REST API.
 */
export async function sendHandoffEmail(input: IHandoffEmailInput): Promise<void> {
    const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim();
    const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim();
    const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim();

    if (!serviceId || !templateId || !publicKey) {
        throw new Error("Handoff email is not configured for this deployment.");
    }

    const response = await fetch(EMAILJS_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
                to_email: input.recipientEmail,
                inbox_label: input.recipientLabel,
                contact_email: input.contactEmail,
                bot_name: input.botName,
                deployment_key: input.deploymentKey,
                session_id: input.sessionId,
                transcript: input.transcript,
                variables_json: JSON.stringify(input.variables, null, 2)
            }
        })
    });

    if (!response.ok) {
        throw new Error("The handoff email could not be sent.");
    }
}
