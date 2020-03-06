// MISC
shuffleArray = function(original){
	let array = original.map(x=>x);
	let i = array.length;
	while(i--){
		let j = ~~(Math.random()*(i+1));
		[array[i],array[j]] = [array[j],array[i]];
	} return array;
}


// IMPLEMENTACAO DE ESPERA OCUPADA E NOTIFYALL
var resolves = {};
wait = function(info = {}, sleepTime = 30000){
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

// GRAFO AUXILIAR PARA DETECCAO DE DEADLOCK
var GV = []; // GV[v] é uma lista dos recursos que v está requisitando
var GE = []; // GE[u] responde pra qual processo o recurso u está alocado

initGV = function(filo,bebidas){
	for(let bebida of bebidas) GV[filo][bebida] = true;
}
setGE = function(bebida,filo){
	if(GE[bebida] != -1) return 0;
	delete GV[filo][bebida];
	GE[bebida] = filo;
	return 1;
}
unsetGE = function(bebida,filo){
	if(GE[bebida] != filo) return 0;
	GE[bebida] = -1;
	GV[filo][bebida] = true;
	return 1;
}
liberarBebidas = function(filo,bebidas){
	let cont = 0;
	for(let bebida of bebidas) cont += unsetGE(bebida,filo);
	if(cont < bebidas.length) console.log("ALGO ERRADO ACONTECEU!!");
}
findDeadLock = function(vertice){ // BFS pra procurar ciclo
	let fila = new Int8Array(V); let vis = new Int8Array(V); 
	let qt = 0; fila[qt++] = vertice; vis[vertice] = 1;
	for(let i = 0; i<qt; i++){
		for(let bebida in GV[fila[i]]){
			let vizinho = GE[+bebida];
			// se o vizinho ja foi visitado, entao achou ciclo
			if(~vizinho && vis[vizinho]) return true;
			vis[vizinho] = 1;
			fila[qt++] = vizinho;
		}
	} return false;
}

// VARIAVEIS DO AMBIENTE
var contador = 0; // quantos instancias estao em execucao
var iterations = 0; // vezes que cada filosofo deve beber
var G = []; // lista de bebidas de cada filosofo
var V; // quantidade de filosofos
var E; // quantidade de bebidas
var tempos = []; // contador de tempo em cada estado
var inicioExecucao;

showStatistics = function(){
	console.log("Tempo total: "+((new Date())-inicioExecucao)+"ms");
	for(let i=0; i<V; i++) console.log("Filosofo "+i+": "+tempos[i][0]+"ms tranquilo; "+tempos[i][1]+"ms com sede;");
}

// THREAD QUE REPRESENTA UM FILOSOFO
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
		
		// SE ALGUMA BEBIDA INDISPONIVEL, VAI PRA ESPERA BLOQUEADA
		initGV(filosofoId, sortedBebidas);
		let cont = 0;
		while(true){
			for(let bebida of sortedBebidas){
				cont += setGE(bebida,filosofoId);
				// se o filosofo pegando essa bebida gera deadlock, desfaz
				if(findDeadLock(filosofoId))
					cont -= unsetGE(bebida,filosofoId);
			}
			if(cont == quantasBebidas) break;
			await wait();
		}
		
		let tempoSede = (new Date()) - inicioSede;
		tempos[filosofoId][1] += tempoSede;
		console.log("comSede = filosofo "+filosofoId+" por "+tempoSede+"ms");
		
		// ESTADO BEBENDO
		tempos[filosofoId][2] += 1000;
		console.log(filosofoId+" BEBENDO");
		await sleep(1000);
		
		// LIBERA AS BEBIDAS E NOTIFICA TODOS QUE ESTIVEREM AGUARDANDO
		liberarBebidas(filosofoId, sortedBebidas);
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
	G = []; tempos = []; GV = [];
	E = 0;
	for(let i=0; i<V; i++){ G.push([]); tempos.push([0,0,0]); GV.push({}); }
	for(let i=0; i<V; i++){
		for(let j=i+1; j<V; j++){
			if(+grafo[i][j]){
				GE[E] = -1;
				G[i].push(E);
				G[j].push(E++); }}}
	iterations = V > 6 ? 3 : 6;
	console.log("Lista de adjacencias Filosofo->Bebidas", G);

	inicioExecucao = new Date();
	for(let filo = 0; filo < V; filo++){
		filosofo(filo); contador++;
	}
}







