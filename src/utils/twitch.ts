export async function getLiveTwitchStream() {
  try {
    const res = await fetch('https://gql.twitch.tv/gql', {
      method: 'POST',
      headers: {
        'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
      },
      body: JSON.stringify({
        query: `query { 
          user(login: "kristoff_kriollo") { 
            stream { 
              id
              type 
              title
              viewersCount
            } 
          } 
        }`
      })
    });
    const data = await res.json();
    return data?.data?.user?.stream || null;
  } catch (error) {
    console.error("Error fetching twitch status", error);
    return null;
  }
}
