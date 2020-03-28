function shuffleArray(original){
	let array = original.map(x=>x);
	let i = array.length;
	while(i--){
		let j = ~~(Math.random()*(i+1));
		[array[i],array[j]] = [array[j],array[i]];
	} return array;
}

function sleep(sleepTime = 0){
	return new Promise(resolve=>{
		setTimeout(()=>resolve(), sleepTime);
	});
}

var waitResolve;
var notifyId;
var isWaiting = false;
function wait(sleepTime = 30000){
	return new Promise(resolve=>{
		notifyId = setTimeout(()=>resolve(), sleepTime);
		isWaiting = true;
		waitResolve = resolve;
	});
}

function notify(){
	if(!isWaiting) return;
	clearTimeout(notifyId);
	waitResolve();
	isWaiting = false;
}

// FUNCOES

var tempos = [0,0,0];
var bebidas = [];
var pegou = [];
var iterations;
var filosofoId;

var lockResolve;
function lock(sortedBebidas){ return new Promise(resolve=>{
	postMessage({key:"lock", value: sortedBebidas, id: filosofoId});
	lockResolve = resolve;
});}
function liberarBebidas(sortedBebidas){
	postMessage({key:"liberarBebidas", value: sortedBebidas, id: filosofoId});
}
function unlock(sortedBebidas){
	postMessage({key:"unlock", value: sortedBebidas, id: filosofoId});
}
function sendStatistics(){
	postMessage({key:"sendStatistics", value: tempos, id: filosofoId});
}

// EXECUCAO DO FILOSOFO
async function filosofo(){
	for(let iteration=0; iteration<iterations; iteration++){
		
		// ESTADO TRANQUILO
		let inicioTranquilo = new Date();		
		let tempoTranquilo = ~~(Math.random()*2000);
		await sleep(tempoTranquilo);
		
		let quantasBebidas = ~~(Math.random()*(bebidas.length-1))+2;
		let sortedBebidas = shuffleArray(bebidas).slice(0,quantasBebidas);
		//await initGV(sortedBebidas);
		
		tempoTranquilo = (new Date()) - inicioTranquilo;
		tempos[0] += tempoTranquilo;
		console.log("tranquilo = filosofo "+filosofoId+" por "+tempoTranquilo+"ms");

		// ESTADO COM SEDE
		let inicioSede = new Date();
		while(false == await lock(sortedBebidas)){
			await wait();
		}
		// como as bebidas estarao livres em 1seg
		// ja pode liberar elas no grafo do deadlock
		liberarBebidas(sortedBebidas);
		
		let tempoSede = (new Date()) - inicioSede;
		tempos[1] += tempoSede;
		console.log("comSede = filosofo "+filosofoId+" por "+tempoSede+"ms");
		
		// ESTADO BEBENDO
		let inicioBebendo = new Date();
		await sleep(1000);
		let tempoBebendo = (new Date()) - inicioBebendo;
		tempos[2] += tempoBebendo;
		console.log(filosofoId+" BEBENDO por "+tempoBebendo+"ms");
		
		// DESBLOQUEIA AS BEBIDAS E NOTIFICA TODOS QUE ESTIVEREM EM ESPERA
		unlock(sortedBebidas);
	}
	console.log("filosofo "+filosofoId+" terminou.");
	sendStatistics();
	close();
}

function run(params){
	bebidas = params[2];
	iterations = params[1];
	filosofoId = params[0];
	filosofo();
}

var onmessage = function(e){
	//console.log(e);
	if(e.data.key == "run"){
		run(e.data.value);
	} else
	if(e.data.key == "lock"){
		lockResolve(e.data.value);
	} else
	if(e.data.key == "wake"){
		notify();
	}
}
