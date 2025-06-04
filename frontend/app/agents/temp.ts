export const initializeAgents = async (signer?: any) => {
    if (!signer) {
        throw new Error("Wallet signer is required. Please connect your wallet first.");
    }

    const baseOptions = {
        apiKey: process.env["NEXT_PUBLIC_BRIAN_API_KEY"]!,
        privateKeyOrAccount: signer,
        llm: new ChatOpenAI({
            apiKey: process.env["NEXT_PUBLIC_OPENAI_API_KEY"]!,
            modelName: "gpt-4",
        }),
    };

    const agents = await createSpecializedAgents(baseOptions);
    return agents;
};
