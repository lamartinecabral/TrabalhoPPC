shuffleArray = function(original){
	let array = original.map(x=>x);
	let i = array.length;
	while(i--){
		let j = ~~(Math.random()*(i+1));
		[array[i],array[j]] = [array[j],array[i]];
	} return array;
}

var resolves = {};
wait = function(info = {}, sleepTime = 20000){
	return new Promise(resolve=>{
		let notifyId = setTimeout(()=>resolve(), sleepTime);
		resolves[notifyId] = resolve;
		info.notifyId = notifyId;
	});
}
notify = function(info){
	resolves[info.notifyId]();
	clearTimeout(info.notifyId);
	delete resolves[info.notifyId];
}
notifyAll = function(){
	for(let notifyId in resolves) notify({notifyId});
}
sleep = function(sleepTime = 0){
	return new Promise(resolve=>{
		setTimeout(()=>resolve(), sleepTime);
	});
}

var contador = 0; // quantos instancias estao em execucao
var iterations = 6; // quantidade de vezes que cada filosofo bebe
var blocked = []; // marcador para exclusao mutua de bebidas
var G = []; // lista de bebidas de cada filosofo
var V; // quantidade de filosofos
var tempos = []; // contador de tempo em cada estado
var inicioExecucao;

showStatistics = function(){
	console.log("Tempo total: "+((new Date())-inicioExecucao)+"ms");
	for(let i=0; i<V; i++) console.log("Filosofo "+i+": "+tempos[i][0]+"ms tranquilo; "+tempos[i][1]+"ms com sede;");
}
check = function(array){
	for(let a of array) if(blocked[a]) return false; return true;
}
block = function(array){
	for(let a of array) if(++blocked[a] > 1) console.log("ALGO ERRADO ACONTECEU!!!");
}
unblock = function(array){
	for(let a of array) if(--blocked[a] > 0) console.log("ALGO ERRADO ACONTECEU!!");
}


filosofo = async function(filosofoId){
	for(let iteration=0; iteration<iterations; iteration++){
		
		// ESTADO TRANQUILO
		let tempoTranquilo = ~~(Math.random()*2000);
		await sleep(tempoTranquilo);
		tempos[filosofoId][0] += tempoTranquilo;
		console.log("tranquilo = filosofo "+filosofoId+" por "+tempoTranquilo+"ms");
		
		// ESTADO COM SEDE
		let inicioSede = new Date();
		let quantasBebidas = ~~(Math.random()*(G[filosofoId].length-1))+2;
		let sortedBebidas = shuffleArray(G[filosofoId]).slice(0,quantasBebidas);
		
		// SE BEBIDAS INDISPONIVEIS, VAI DORMIR
		while(!check(sortedBebidas)){
			await wait();
		}
		block(sortedBebidas);
		
		let tempoSede = (new Date()) - inicioSede;
		tempos[filosofoId][1] += tempoSede;
		console.log("comSede = filosofo "+filosofoId+" por "+tempoSede+"ms");
		
		// ESTADO BEBENDO
		tempos[filosofoId][2] += 1000;
		console.log(filosofoId+" BEBENDO");
		await sleep(1000);
		
		// LIBERA AS BEBIDAS E NOTIFICA TODOS QUE ESTIVEREM AGUARDANDO
		unblock(sortedBebidas);
		notifyAll();
	}
	console.log("filosofo "+filosofoId+" terminou.");
	if(--contador == 0){ showStatistics(); document.querySelector("#button").disabled = false; }
}


run = function(){
	document.querySelector("#button").disabled = true;
	console.clear();
	
	let grafo = document.querySelector("#grafo").innerHTML;
	grafo = grafo.split('\n').filter(x=>x.length).filter(x=>x[0]=="0"||x[0]=="1").map(x=>x.split("//").filter(x=>x[0]=="0"||x[0]=="1").join().split(", ").join(""));
	console.log("Matriz de adjacencias",grafo);
	
	V = grafo.length;
	blocked = []; G = []; tempos = [];
	var aresta = 0;
	for(let i=0; i<V; i++){ G.push([]); tempos.push([0,0,0]); }
	for(let i=0; i<V; i++){
		for(let j=i+1; j<V; j++){
			if(+grafo[i][j]){
				blocked[aresta] = 0;
				G[i].push(aresta);
				G[j].push(aresta++); }}}
	if(V > 6) iterations = 3;
	console.log("Lista de adjacencias Filosofo->Bebidas",G);

	inicioExecucao = new Date();
	for(let filo = 0; filo < V; filo++){
		filosofo(filo); contador++;
	}
}

