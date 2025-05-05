import { AxiosResponse } from "axios";
import { EventBus, EventType } from "../core/event-bus";

async function mergeTucao(url: string, topTucaoResponse: AxiosResponse): Promise<any> {
    const allUrl = url.replace('list', 'all');

    try {
        const {data: allTucao} = await axios.get(allUrl);
        const topTucao = topTucaoResponse.data;
        allTucao.hot_tucao = topTucao.hot_tucao;

        const tucaoId = url.split('/').pop()!;
        const newTucaoCount = allTucao.tucao?.length || 0;
        EventBus.$emit(EventType.TUCAO_LOADED, {
            tucaoId,
            newTucaoCount
        });

        return allTucao;
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
