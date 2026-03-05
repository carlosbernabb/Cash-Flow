const SUPABASE_URL = 'https://pviwplgdiotrxbplaemf.supabase.co';
const SUPABASE_KEY = 'TU_SECRET_KEY_AQUI'; // Remove secret key before pushing

async function run() {
    console.log("Connecting to Supabase using REST API...");

    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/events?select=id,title`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        const events = await res.json();

        if (events.error) {
            console.error(events.error);
            return;
        }

        for (const event of events) {
            let newImageUrl = '';
            if (event.title.includes('Roll\'n\'Rodz')) {
                newImageUrl = 'multimedia_cash/cash0404.jpeg';
            } else if (event.title.includes('Vol. 2')) {
                newImageUrl = 'multimedia_cash/cash0402.png';
            } else if (event.title.includes('Vol. 1')) {
                newImageUrl = 'multimedia_cash/cash0401.png';
            }

            if (newImageUrl) {
                const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/events?id=eq.${event.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ image_url: newImageUrl })
                });

                if (patchRes.ok) {
                    console.log("Updated event:", event.title, "->", newImageUrl);
                } else {
                    console.error("Failed to update:", event.title, await patchRes.text());
                }
            }
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
