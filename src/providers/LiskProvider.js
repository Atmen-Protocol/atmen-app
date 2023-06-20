// payload = {
//     "jsonrpc": "2.0",
//     "id": 1,
//     "method": f"{method}"
// }
// if params:
//     payload["params"] = params
// if not endpoint:
//     endpoint = RPC_ENDPOINTS[os.environ["NETWORK"]]
// headers = {"content-type": "application/json", "Accept-Charset": "UTF-8"}
// # print(f"RPC: Sending {method}/{params} to {endpoint}.")
// return requests.post(f"http://{endpoint}/rpc", headers=headers, json=payload)

const sendLiskTransaction = async () => {
    hex_trs = "32";
    payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "txpool_postTransaction",
        params: { transaction: `${hex_trs}` },
    };
    const response = await fetch("http://localhost:7887/rpc", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            accept: "application/json",
        },
        body: JSON.stringify(payload),
    });
};
