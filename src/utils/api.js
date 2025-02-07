import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from 'xlsx'; // Importe a biblioteca xlsx

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);

export async function extractDataFromVideo(videoFile) {
    try {
        if (!geminiApiKey) {
            reportError("Chave da API Gemini não configurada no frontend.");
            throw new Error("Chave da API Gemini não configurada no frontend.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

        // Converter o arquivo de vídeo para Base64
        const videoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove o prefixo 'data:video/...'
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(videoFile);
        });

        // Prompt Otimizado - Extrai apenas Nome/Nick e Pontuação
        const prompt = `
        Extract the following data from the table in the image:
        - Names/Nicks: The player's name or nickname.
        - Score: The player's score.

        Return the data in JSON format, with each object representing a row in the table.  The JSON structure should be:
        \`\`\`json
        [
          {
            "Names/Nicks": "string",
            "Score": number
          },
          ...
        ]
        \`\`\`
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: videoFile.type,
                    data: videoBase64
                }
            },
            { text: prompt }
        ]);

        const responseText = result.response.text();
        console.log("Gemini API Response:", responseText);

        let extractedData = [];

        try {
            const jsonStringLimpo = responseText.replace('```json\n', '').replace('\n```', '');
            extractedData = JSON.parse(jsonStringLimpo);
        } catch (jsonError) {
            console.warn("Resposta da Gemini API não é JSON válido, tentando extrair dados como texto:", jsonError);
        }

        if (!Array.isArray(extractedData)) {
            throw new Error("Nenhum texto ou dados extraídos pela API Gemini.");
        }

        // Determinar a semana atual
        const today = new Date();
        const dayOfMonth = today.getDate();
        let weekNumber;

        if (dayOfMonth <= 7) {
            weekNumber = 1;
        } else if (dayOfMonth <= 14) {
            weekNumber = 2;
        } else if (dayOfMonth <= 21) {
            weekNumber = 3;
        } else {
            weekNumber = 4;
        }

        // Gerar o arquivo Excel
        generateExcel(extractedData, weekNumber);

        return extractedData; // Retorna os dados originais para outros usos, se necessário

    } catch (error) {
        reportError(error);
        throw new Error(`Failed to process video: ${error.message}`);
    }
}

function generateExcel(data, weekNumber) {
    // Mapeamento de semanas para colunas
    const weekColumnMap = {
        1: 'F',
        2: 'I',
        3: 'L',
        4: 'O'
    };

    const columnLetter = weekColumnMap[weekNumber];

    // Criar uma planilha
    const ws = XLSX.utils.aoa_to_sheet([["Nome/Nick", "Pontuação"]]);

    // Inserir os dados
    data.forEach((item, index) => {
        const rowNumber = index + 2; // Começar na linha 2 (linha 1 é o cabeçalho)
        const nameCell = `A${rowNumber}`;
        const scoreCell = `${columnLetter}${rowNumber}`;

        XLSX.utils.sheet_add_aoa(ws, [[item["Names/Nicks"]]], { origin: nameCell }); // Inserir apenas o nome
        XLSX.utils.sheet_add_aoa(ws, [[item["Score"]]], { origin: scoreCell });    // Inserir a pontuação na coluna correta
    });

    // Criar uma pasta de trabalho
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pontuações");

    // Gerar o arquivo Excel como um Blob
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([new Uint8Array(wbout)], { type: 'application/octet-stream' });

    // Criar um link para download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "pontuacoes.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function reportError(error) {
    console.error("An error occurred:", error);
}