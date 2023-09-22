const wppconnect = require('@wppconnect-team/wppconnect');
const firebasedb = require('./firebase');


var userStages = {};
var imagensEnviadas = 0;

wppconnect.create({
    session: 'whatsbot',
    autoClose: false,
    puppeteerOptions: { args: ['--no-sandbox'] }
})
    .then((client) =>
        client.onMessage((message) => {
            console.log('Mensagem digitada pelo usuário: ' + message.body);
            stages(client, message);
        }))
    .catch((error) =>
        console.log(error));

async function queryUserByPhone(client, message) {
    let phone = (message.from).replace(/[^\d]+/g, '');
    let userdata = await firebasedb.queryByPhone(phone);
    if (userdata == null) {
        userdata = await saveUser(message);
    }
    console.log('Usuário corrente: ' + userdata['id']);
    stages(client, message, userdata);
}

function stages(client, message) {
    const userStage = userStages[message.from] || 0;

    switch (userStage) {
        case 0:
            if (message.body === '1') {
                sendWppMessage(client, message.from, `Para contratar este pacote, faça o pagamento via PIX através do pix-cola abaixo.\n\nn00020126360014BR.GOV.BCB.PIX0114+5567992888888520400005303986540575.005802BR5918Apptite Interprise6012CampoGrande62240520KQZG4P7A9U0N1X8V3E5H63043A66\n\nQuando finalizar o pagamento, nos envie "Já paguei":`);
                userStages[message.from] = 1;
            } else if (message.body === '2') {
                sendWppMessage(client, message.from, 'Agora, vou precisar conhecer um pouco mais da sua empresa.\nInforme o seu Instagram:\n\nR:');
                userStages[message.from] = 2;
            } else if (message.body === '3') {
                sendWppMessage(client, message.from, 'Você já é nosso cliente. Em breve entraremos em contato com você.');
                userStages[message.from] = 'Fim';
            } else {
                sendWppMessage(client, message.from, `Seja bem-vindo ao Apetite.\n\nMas pode me chamar de Tite.\n\nSou um chatbot especializado em social-marketing.\nEstou aqui para te ajudar a aumentar suas vendas pelo Instagram.\n\nNesta semana de lançamento estamos com um plano promocional imperdível.\nUm pacote com 3 posts por somente R$ 75,00.\n\nEscolha uma das seguintes opções:\n\n1 - Quero contratar agora\n\n2 - Quero conhecer mais\n\n3 - Já sou cliente`);//alteração: apetite
            }
            break;

        case 1:
            if (message.body === 'Já paguei') {
                sendWppMessage(client, message.from, 'Muito obrigado, já confirmamos o seu pagamento. Me envie o @ do seu instagram:');
                userStages[message.from] = 2;
            }
            break;

        case 2:
            if (message.body === '@apetite'){
                sendWppMessage(client, message.from, 'Muito obrigado, agora irei analisar sua página, mas precisarei de algumas horas para terminar este processamento. Me envie "Ok" para prosseguir:');
                userStages[message.from] = 3;
            } else {
                sendWppMessage(client, message.from, 'Desculpe, não entendi. Por favor, informe seu @ do Instagram.');
            }
            break;

        case 3:
            sendWppMessage(client, message.from, 'Assim que eu terminar, te aviso aqui, tudo bem?\n\nEnvie "Tudo bem".');
            if (message.body === 'Tudo bem') {
                userStages[message.from] = 4; // Avançar para o próximo estágio (envio de imagens)
            }
            break;
        
        case 4:
            if (imagensEnviadas === 0) {
                // Esta é a primeira imagem, envie a mensagem e atualize a variável de controle
                sendWppMessage(client, message.from, 'Pronto, terminei o processamento. Agora, preciso de 3 fotos para poder criar os post em cima delas.\n\nPor favor, envie a primeira imagem. (Envie uma por vez)');
                imagensEnviadas++;
            } else if (imagensEnviadas === 1) {
                // O usuário já enviou a primeira imagem, agora peça a segunda imagem
                sendWppMessage(client, message.from, 'Ótimo, você enviou a primeira imagem. Agora, por favor, envie a segunda imagem.');
                imagensEnviadas++;
            } else if (imagensEnviadas === 2) {
                // O usuário já enviou a segunda imagem, agora peça a última imagem
                sendWppMessage(client, message.from, 'Ótimo, você enviou a segunda imagem. Agora, por favor, envie a última imagem.');
                imagensEnviadas++;
            } else if (imagensEnviadas === 3) {
                // Todas as três imagens foram enviadas, agora peça as frases
                sendWppMessage(client, message.from, 'Ótimo, agora preciso das frases para cada imagem. Envie uma frase para cada imagem.');
                userStages[message.from] = 5;
            }
            break;
            
        case 5:
            sendWppMessage(client, message.from, 'Está pronto, agora é só publicar:\n\n<Título>\n<Copy com hashtags>\n<IMAGEM>\n\n<Título>\n<Copy com hashtags>\n<IMAGEM>\n\n<Título>\n<Copy com hashtags><IMAGEM>')
            userStages[message.from] = 'Fim';
            break; //case 5 é feito manualmente, magico de óz. Fica aqui como exemplo. 
        
            
        case 'Fim':
            if (message.body.toLowerCase() === 'reiniciar') {
                // Se o usuário enviar "reiniciar", reinicie o fluxo definindo o estágio para 0
                userStages[message.from] = 0;
                sendWppMessage(client, message.from, 'Bem-vindo de volta! Envie um "Oi" para iniciar as opções.');
            } else if (message.body.toLowerCase() === 'obrigado'){
                sendWppMessage(client, message.from, 'Obrigado por utilizar nossos serviços! Se precisar de suporte ou tiver alguma dúvida, entre em contato conosco através do número: +556799999999. Tenha um ótimo dia!\n\nPara reiniciar o fluxo, envie "Reiniciar"');
            }
            break;
            

        default: // Mensagem inicial
            console.log('*Usuário atual* from:' + message.from);
            saveUser(message);
            sendWppMessage(client, message.from, `Seja bem-vindo ao Apptite.\n\nMas pode me chamar de Tite.\n\nSou um chatbot especializado em social-marketing.\nEstou aqui para te ajudar a aumentar suas vendas pelo Instagram.\n\nNesta semana de lançamento estamos com um plano promocional imperdível.\nUm pacote com 3 posts por somente R$ 75,00.\n\nEscolha uma das seguintes opções:\n\n1 - Quero contratar agora\n\n2 - Quero conhecer mais\n\n3 - Já sou cliente`);
            userStages[message.from] = 0;
    }
}

function sendWppMessage(client, sendTo, text) {
    client
        .sendText(sendTo, text)
        .then((result) => {
            // console.log('SUCESSO: ', result); 
        })
        .catch((erro) => {
            console.error('ERRO: ', erro);
        });
}

async function saveUser(message) {
    let user = {
        'pushname': (message['sender']['pushname'] != undefined) ? message['sender']['pushname'] : '',
        'whatsapp': (message.from).replace(/[^\d]+/g, '')
    }
    let newUser = firebasedb.save(user);
    return newUser;
}