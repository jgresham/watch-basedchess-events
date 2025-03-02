if (process.env.NEYNAR_API_KEY) {
  console.log('NEYNAR_API_KEY is set');
} else {
  console.error('NEYNAR_API_KEY is not set');
  process.exit(1);
}

export const getFarcasterUserByAddress = async (address: string): Promise<{
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}> => {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`, {
    headers: {
      'accept': 'application/json',
      'x-api-key': process.env.NEYNAR_API_KEY,
      'x-neynar-experimental': 'false'
    }
  });

  const data = await response.json();
  console.log(data);
  if (data?.[address] && data[address].length > 0) {
    const { fid, username, display_name, pfp_url } = data[address][0];
    console.log(`For address ${address}, found user ${username}, ${fid}, ${display_name}, ${pfp_url}`);
    return { fid, username, display_name, pfp_url };
  } else {
    console.log(`For address ${address}, no user found`);
  }
  return null;
};
