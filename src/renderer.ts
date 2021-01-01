import './index.css';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

import echarts = require('echarts')
import { EChartOption } from "echarts"
import jQuery from 'jquery';
const jq = jQuery.noConflict(true);
window.onload = function () {
    let winHeight = 0;
    if (window.innerHeight) {
        winHeight = window.innerHeight;
    } else if ((document.body) && (document.body.clientHeight)) {
        winHeight = document.body.clientHeight;
    }
    const html = document.getElementsByTagName('html')[0];
    if (document.body.offsetHeight < winHeight) {
        html.style.height = String(winHeight);
    }
};
let data: data;
document.getElementById('fileInput').addEventListener('change', function selectedFileChanged() {
    const reader = new FileReader();
    reader.onload = function () {
        data = JSON.parse(reader.result as string);
        console.log(data, reader.result)
        draw(data);
    }
    reader.readAsText((this as unknown as {files:Blob[]}).files[0], "UTF-8");
});
function draw(data: data) {
    const timeRangeText = jq("#timeRange-input").val() as string;
    const roomRangeText = jq("#roomRange-input").val() as string;
    const timeRange = eval(timeRangeText);
    const roomRange = eval(roomRangeText);
    const graph = data2Graph(data, timeRange, roomRange);
    drawGraph(graph);
}

function drawGraph(graph: ReturnType<typeof data2Graph>) {
    const myChart = echarts.init(document.getElementById("echarts-main") as HTMLDivElement);
    myChart.setOption(graph);
}

jq(function () {
    jq("#gen-btn").on("click", function () {
        echarts.dispose(document.getElementById("echarts-main") as HTMLDivElement)
        draw(data);
    });
});

type singleData = [objectInf, objectInf, string | number, number, string];
type data = singleData[];
interface objectInf {
    idType: string;
    baseType: string;
    namedType: string;
}

function data2Graph(data: data, timeRange: number[], roomRange: string[]):EChartOption {
    const colors = ['rgb(255,63,93)', 'rgb(243,158,121)', 'rgb(180,60,153)', 'rgb(140,164,220)', 'rgb(130,208,255)']
    const timeData: number[] = [];
    const myEdgeLabel = {
        show: true, //是否显示标签。
        x: 'middle', //标签的位置。// 'start' 线的起始点。'middle' 线的中点。'end' 线的结束点。
        y: 'middle',

        // offset: [-50, -50], //是否对文字进行偏移。默认不偏移。例如：[30, 40] 表示文字在横向上偏移 30，纵向上偏移 40。
        formatter: "{c}", //标签内容格式器。模板变量有 {a}、{b}、{c}，分别表示系列名，数据名，数据值。
        color: "#333", //文字颜色
        fontStyle: "normal", //italic斜体  oblique倾斜
        fontWeight: "normal", //文字粗细bold   bolder   lighter  100 | 200 | 300 | 400...
        fontFamily: "sans-serif", //字体系列
        fontSize: 13 //字体大小
    };
    const myLabel = {
        show: true, //是否显示标签。
        x: 'middle', //标签的位置。// 'start' 线的起始点。'middle' 线的中点。'end' 线的结束点。
        y: 'middle', //标签的位置。// 绝对的像素值[10, 10],// 相对的百分比['50%', '50%'].'top','left','right','bottom','inside','insideLeft','insideRight','insideTop','insideBottom','insideTopLeft','insideBottomLeft','insideTopRight','insideBottomRight'
        // offset: [50, 50], //是否对文字进行偏移。默认不偏移。例如：[30, 40] 表示文字在横向上偏移 30，纵向上偏移 40。
        formatter: function (e: { [x: string]: { [x: string]: unknown; }; }) {
            return e['data']['value'];
        },
        color: "#333", //文字颜色
        fontStyle: "normal", //italic斜体  oblique倾斜
        fontWeight: "normal", //文字粗细bold   bolder   lighter  100 | 200 | 300 | 400...
        fontFamily: "sans-serif", //字体系列
        fontSize: 16 //字体大小
    };
    const currentTimeRange = [Infinity, 0];
    for (let i = 0; i < data.length; i++) {
        const time = Number(data[i][3])
        if (timeRange && !(time >= timeRange[0] && time <= timeRange[1])) continue;
        if (currentTimeRange[0] > time) currentTimeRange[0] = time;
        if (currentTimeRange[1] < time) currentTimeRange[1] = time;
    }
    if (currentTimeRange[1] != Infinity) {
        for (let i = currentTimeRange[0]; i <= currentTimeRange[1]; i++) {
            if (i % 100 != 0) continue;
            timeData.push(i);
        }
    }
    const graphOption:{baseOption:EChartOption,options:EChartOption[]} =
    {
        baseOption:{
            tooltip: {
                trigger: 'item',
            },
            toolbox: {
                show: true,
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    dataView: { readOnly: false },
                    magicType: { type: ['line', 'bar'] },
                    restore: {},
                    saveAsImage: {}
                }
            },
            timeline: {
                axisType: 'value',
                data: timeData
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    draggable: true,
                    edgeSymbol: ['none', 'arrow'],
                    symbolSize: 150,
                    roam: true,
                    label: myLabel,
                    edgeLabel: myEdgeLabel,
                    force: {
                        friction: 0.2,
                        repulsion: 10000,
                        edgeLength: 700
                    },
                    lineStyle: {
                        opacity: 0.9,
                        width: 2,
                        curveness: 0.2
                    },
                }
            ],
        },
        options:[]
    }
    for (const time of timeData) {
        const vertices:{[name in string]:{ name: string, value: number }} = {}
        const nodes: { name: string; value: string; symbolSize: number; itemStyle: { color: string; }; }[] = [];
        const links: { source: string; target: string; value: number; }[] = [];
        const selectedTimeRange = [currentTimeRange[0], time]
        for (let i = 0; i < data.length; i++) {
            const time = Number(data[i][3])
            if (selectedTimeRange && !(time >= selectedTimeRange[0] && time <= selectedTimeRange[1])) continue;
            const s = String(data[i][0].namedType)
            const t = String(data[i][1].namedType)
            const v = Number(data[i][2]);
            const room = String(data[i][4])
            if (roomRange && !roomRange.some((value: string) => { return value === room })) continue;
            if (!vertices[s]) {
                vertices[s] = { name: s, value: -v };
            } else {
                vertices[s]["value"] -= v;
            }
            if (!vertices[t]) {
                vertices[t] = { name: t, value: v };
            } else {
                vertices[t]["value"] += v;
            }
            const state = links.some(link => {return link.source === s&&link.target === t})
            if(state === false){
                links.push({ source: s, target: t, value: 0});
            }
            links[links.findIndex(link => link.source === s&&link.target === t)].value+=v;
        }
        let maxValue = 0;
        jq.each(vertices, function (k, v) {
            if (maxValue < Math.abs(v.value)) maxValue = Math.abs(v.value);
        });
        jq.each(vertices, function (k, v) {
            // const maxValueDigit = Math.log10(maxValue)
            // const valueDigit = Math.log10(Math.abs(v.value))
            const statusNum = Math.log10(maxValue) - Math.log10(Math.abs(v.value))
            const symbolSize = statusNum < 3 ? Math.round((6 - statusNum) * 50) : 150;
            let color = "";
            if (statusNum < 3 && v.value > 0) color = colors[1]
            if (statusNum < 3 && v.value < 0) color = colors[3]
            if (statusNum < 1.5 && v.value > 0) color = colors[0]
            if (statusNum < 1.5 && v.value < 0) color = colors[4]
            if (statusNum > 3) color = colors[2]
            nodes.push({
                name: v.name, value: v.name + ":" + v.value,
                symbolSize: symbolSize,
                itemStyle: { color: color }
            });
        });
        graphOption.options.push({
            series: [{
                type: 'graph',
                layout: 'force',
                draggable: true,
                edgeSymbol: ['none', 'arrow'],
                symbolSize: 150,
                data: nodes,
                links: links,
                roam: true,
                label: {
                },
                edgeLabel: {
                    // 显示线中间的标签
                    show: true,
                },
                force: {
                    repulsion: 10000,
                    edgeLength: 700
                },
                lineStyle: {
                    opacity: 0.9,
                    width: 2,
                    curveness: 0.2
                },
            }
            ],
        })
    }
    return graphOption as EChartOption;
}
