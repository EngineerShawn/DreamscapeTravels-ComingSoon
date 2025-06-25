export default async function handler(req, res) {
    // 1. Check if the request method is POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email } = req.body;

    // 2. Validate the email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'A valid email is required.' });
    }

    // 3. Securely get environment variables
    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
    const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

    // 4. Check if server configuration is complete
    if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
        console.error("Server environment variables are missing!");
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const subscriber = {
        email: email,
        groups: [MAILERLITE_GROUP_ID],
        status: 'active',
    };

    // 5. Make the API call to MailerLite
    try {
        const mailerliteResponse = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            },
            body: JSON.stringify(subscriber),
        });

        // 6. **THE FIX:** Check if the response was successful before trying to parse JSON
        if (mailerliteResponse.ok) {
            // Success! The subscriber was added. We can just send our own success message back.
            return res.status(201).json({ message: 'Successfully subscribed!' });
        } else {
            // If the response is not OK, *then* we try to parse the error message from MailerLite
            const errorData = await mailerliteResponse.json();
            const errorMessage = errorData?.error?.message || 'Failed to subscribe due to an API error.';
            console.error('MailerLite API Error Response:', errorData);
            return res.status(mailerliteResponse.status).json({ message: errorMessage });
        }

    } catch (error) {
        console.error('General API Error:', error);
        return res.status(500).json({ message: 'An internal server error occurred.' });
    }
}