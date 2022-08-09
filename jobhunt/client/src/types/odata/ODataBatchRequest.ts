type ODataBatchRequest = {
  requests: ODataRequest[]
}

type ODataRequest = {
  id?: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  headers?: Record<string, string>,
  body?: string
}

export default ODataBatchRequest;