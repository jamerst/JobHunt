type ODataBatchResponse = {
  responses: ODataResponse[]
}

type ODataResponse = {
  id?: string,
  status: number,
  headers: Record<string, string>,
  body: ODataResponseBody
}

type ODataResponseBody = {
  value: any
}

export default ODataBatchResponse;