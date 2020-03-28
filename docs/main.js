// MISC
// shuffleArray = function(original){
// 	let array = original.map(x=>x);
// 	let i = array.length;
// 	while(i--){
// 		let j = ~~(Math.random()*(i+1));
// 		[array[i],array[j]] = [array[j],array[i]];
// 	} return array;
// }


// IMPLEMENTACAO DE ESPERA BLOQUEADA E NOTIFYALL
// var resolves = {};
// wait = function(info = {}, sleepTime = 30000){
// 	return new Promise(resolve=>{
// 		let notifyId = setTimeout(()=>resolve(), sleepTime);
// 		resolves[notifyId] = resolve;
// 		info.notifyId = notifyId;
// 	});
// }
// notify = function(info){
// 	resolves[info.notifyId]();
// 	clearTimeout(info.notifyId);
// 	delete resolves[info.notifyId];
// }
// notifyAll = function(){
// 	for(let notifyId in resolves) notify({notifyId});
// }
// sleep = function(sleepTime = 0){
// 	return new Promise(resolve=>{
// 		setTimeout(()=>resolve(), sleepTime);
// 	});
// }

/*
Um filósofo, quando fica com sede, tenta pegar as bebidas pra
preparar um drink. Se alguma bebida não estiver disponivel, ele
entra em espera bloqueada. E sai da espera quando algum outro
filosofo termina de beber e libera bebidas na mesa.

Quando um filosofo pega uma bebida, ele so libera ela depois que
bebe seu drink. Portanto, pra evitar deadlock, sempre antes de
pegar uma bebida o filosofo verifica se pode causar deadlock
buscando ciclo num grafo de processos e recursos.

Porém, existe uma situação que parece deadlock, mas não é. É quando
existe ciclo no grafo de processos e recursos, mas algumas bebidas
estão bloqueadas por filósofos que estão bebendo, de modo que serão
liberadas com certeza em pouco tempo, quebrando o ciclo.

Para não achar falsos deadlocks, é usado duas estruturas. Uma para
a exclusão mutua das bebidas, e outra para detecção de deadlock.
Funciona assim: quando um filósofo vai pegar uma bebida, primeiro
ele tenta reservar essa bebida pra ele. Nesse momento, a bebida
não está necessariamente na mesa (mais sobre isso adiante). Se
conseguir reservar, ele pegará a bebida assim que ela estiver na mesa.

Para reservar, primeiro a bebida precisa não estar reservada para
outro. Segundo, é preciso verificar que não causará deadlock. Uma
vez reservadas todas as bebidas necessárias, é uma questão de tempo
até ter todas elas disponíveis.

Se um filosofo tem uma bebida reservada e ela está na mesa, ela a pega
e só soltará depois que beber o drink. Uma vez que o filosofo já pegou
todas as bebidas necessárias, ele libera elas para serem reservadas
por outro filosofo e entra no estado de BEBENDO. Somente depois
que terminar de beber é que ele devolve as bebidas para a mesa.
*/


// GRAFO AUXILIAR PARA DETECCAO DE DEADLOCK
var GV = []; // GV[v] é uma lista das bebidas que o filosofo v quer reservar
var GE = []; // GE[u] responde pra qual filosofo a bebida u está reservada

// initGV = function(filo,bebidas){
// 	for(let bebida of bebidas) GV[filo][bebida] = true;
// }
reserva = function(filo,bebida){
	if(GE[bebida] == filo) return 0;
	GV[filo][bebida] = true;
	if(GE[bebida] != -1) return 0;
	delete GV[filo][bebida];
	GE[bebida] = filo;
	return 1;
}
libera = function(filo,bebida){
	if(GE[bebida] != filo) return 0;
	GE[bebida] = -1;
	return 1;
}
liberarBebidas = function(filo,bebidas){
	let cont = 0;
	for(let bebida of bebidas) cont += libera(filo,bebida);
	if(cont < bebidas.length) console.log("ALGO ERRADO ACONTECEU!",filo);
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
var locked = []; // marcador para exclusao mutua de bebidas
var G = []; // lista de bebidas de cada filosofo
var V; // quantidade de filosofos
var E; // quantidade de bebidas
var tempos = []; // contador de tempo em cada estado
var inicioExecucao;

showStatistics = function(){
	console.log("Tempo total: "+((new Date())-inicioExecucao)+"ms");
	for(let i=0; i<V; i++) console.log("Filosofo "+i+": "+tempos[i][0]+"ms tranquilo; "+tempos[i][1]+"ms com sede;");
}
unlock = function(filo,bebidas){
	for(let b of bebidas){ if(locked[b]!=filo) console.log("ALGO ERRADO ACONTECEU!!", filo); locked[b] = -1; }
}
pegouTodas = function(filo,bebidas){
	for(let b of bebidas) if(locked[b]!=filo) return false; return true;
}

// THREAD QUE REPRESENTA UM FILOSOFO
// filosofo = async function(filosofoId){
// 	for(let iteration=0; iteration<iterations; iteration++){
		
// 		// ESTADO TRANQUILO
// 		let tempoTranquilo = ~~(Math.random()*2000);
// 		await sleep(tempoTranquilo);
// 		tempos[filosofoId][0] += tempoTranquilo;
// 		console.log("tranquilo = filosofo "+filosofoId+" por "+tempoTranquilo+"ms");
		
// 		// ESTADO COM SEDE
// 		let inicioSede = new Date();
// 		let quantasBebidas = ~~(Math.random()*(G[filosofoId].length-1))+2;
// 		let sortedBebidas = shuffleArray(G[filosofoId]).slice(0,quantasBebidas);
		
// 		// SE ALGUMA BEBIDA INDISPONIVEL, VAI PRA ESPERA BLOQUEADA
// 		initGV(filosofoId, sortedBebidas);
// 		while(true){
// 			for(let bebida of sortedBebidas){
// 				if(reserva(filosofoId,bebida)){
// 					// se o filosofo pegando essa bebida gera deadlock, ele desiste de pegar
// 					if(findDeadLock(filosofoId))
// 						libera(filosofoId,bebida);
// 					else
// 						if(locked[bebida] == -1) locked[bebida] = filosofoId;
// 				}
// 				else if(GE[bebida] == filosofoId && locked[bebida] == -1)
// 					locked[bebida] = filosofoId;
// 			}
// 			if(pegouTodas(filosofoId,sortedBebidas)) break;
// 			await wait();
// 		}
// 		// como as bebidas estarao livres em 1seg
// 		// ja pode liberar elas no grafo do deadlock
// 		liberarBebidas(filosofoId, sortedBebidas);
		
// 		let tempoSede = (new Date()) - inicioSede;
// 		tempos[filosofoId][1] += tempoSede;
// 		console.log("comSede = filosofo "+filosofoId+" por "+tempoSede+"ms");
		
// 		// ESTADO BEBENDO
// 		tempos[filosofoId][2] += 1000;
// 		console.log(filosofoId+" BEBENDO");
// 		await sleep(1000);
		
// 		// DESBLOQUEIA AS BEBIDAS E NOTIFICA TODOS QUE ESTIVEREM AGUARDANDO
// 		unlock(filosofoId,sortedBebidas);
// 		notifyAll();
// 	}
// 	console.log("filosofo "+filosofoId+" terminou.");
// 	if(--contador == 0){ showStatistics(); document.querySelector("#button").disabled = false; }
// }

run = function(){
	document.querySelector("#button").disabled = true;
	console.clear();
	
	let grafo = document.querySelector("#grafo").value;
	grafo = grafo.split('\n').filter(x=>x.length).filter(x=>x[0]=="0"||x[0]=="1").map(x=>x.split("//").filter(x=>x[0]=="0"||x[0]=="1").join().split(", ").join(""));
	console.log("Matriz de adjacencias",grafo);
	
	V = grafo.length;
	locked = [];
	G = []; tempos = []; GV = [];
	E = 0;
	for(let i=0; i<V; i++){ G.push([]); tempos.push([0,0,0]); GV.push({}); }
	for(let i=0; i<V; i++){
		for(let j=i+1; j<V; j++){
			if(+grafo[i][j]){
				GE[E] = -1;
				locked[E] = -1;
				G[i].push(E);
				G[j].push(E++); }}}
	iterations = V > 6 ? 3 : 6;
	console.log("Lista de adjacencias Filosofo->Bebidas", G);

	inicioExecucao = new Date();
	let thread = [];
	for(let filo = 0; filo < V; filo++){
		contador++;
		//filosofo(filo);
		// initGV(filo, G[filo]);
		thread[filo] = new Worker("filosofo.js");
		thread[filo].onmessage = function(e){
			//console.log(e, "id "+filo);
			let id = e.data.id;

			if(e.data.key == "lock"){
				// get sortedBebidas
				
				let sortedBebidas = e.data.value;
				for(let bebida of sortedBebidas){
					if(reserva(id,bebida)){
						// se o filosofo pegando essa bebida gera deadlock, ele nao pega
						if(findDeadLock(id))
							libera(id,bebida);
						else
							if(locked[bebida] == -1) locked[bebida] = id;
					}
					else if(GE[bebida] == id && locked[bebida] == -1)
						locked[bebida] = id;
				}
				
				thread[id].postMessage({key: "lock", value: pegouTodas(id,sortedBebidas)});
				
			} else
			if(e.data.key == "liberarBebidas"){
				// get sortedBebidas
				
				liberarBebidas(id, e.data.value);
				
			} else
			if(e.data.key == "unlock"){
				// get sortedBebidas
				
				unlock(id, e.data.value);
				for(let i = 0; i<V; i++) thread[i].postMessage({key: "wake"});
				
			} else
			if(e.data.key == "sendStatistics"){
				// get tempos[3]
				
				tempos[id] = e.data.value;
				if(--contador == 0){ showStatistics(); document.querySelector("#button").disabled = false; }
				
			}
		}
		thread[filo].postMessage({key: "run", value: [ filo, iterations, G[filo] ] });
	}
	console.log(GV,GE);
	console.log("running version 1.0");
}