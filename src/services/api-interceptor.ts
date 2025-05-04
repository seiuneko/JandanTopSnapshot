import { AxiosResponse } from "axios";
import { EventBus, EventType } from "../core/event-bus";

async function mergeTucao(url: string, topTucaoResponse: any): Promise<any> {
    const allUrl = url.replace('list', 'all');

    try {
        const {data: allData} = await axios.get(allUrl);
        const topTucao = topTucaoResponse.data;
        allData.hot_tucao = topTucao.hot_tucao;

        const tucaoId = url.split('/').pop()!;
        const newTucaoCount = topTucao.tucao?.length || 0;
        EventBus.$emit(EventType.TUCAO_LOADED, {
            tucaoId,
            newTucaoCount
        });

        return allData;
    } catch (error) {
        console.log(error);
        return topTucaoResponse.data;
    }
}

const setupApiInterceptor = () => {
    axios.interceptors.response.use(async function (response: AxiosResponse) {
        const url = response.config.url;

        if (url?.startsWith('/api/tucao/list')) {
            response.data = await mergeTucao(url, response);
        }

        return response;
    }, function (error: any) {
        return Promise.reject(error);
    });
}

setupApiInterceptor();
