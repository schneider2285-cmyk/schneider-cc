(function(){
  var briefData=null;
  var briefLoaded=false;
  var briefInjected=false;

  // Fetch the daily brief JSON
  fetch('data/daily-brief.json?t='+Date.now())
    .then(function(r){return r.json()})
    .then(function(d){briefData=d;briefLoaded=true;tryInject();})
    .catch(function(e){console.log('Daily brief not available:',e)});

  // Simple markdown to HTML
  function md(s){
    if(!s)return '';
    return s
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/^### (.+)$/gm,'<h4 style="color:#3DCD58;margin:12px 0 4px;font-size:14px">$1</h4>')
      .replace(/^## (.+)$/gm,'<h3 style="color:#3DCD58;margin:12px 0 6px;font-size:15px">$1</h3>')
      .replace(/^# (.+)$/gm,'<h3 style="color:#3DCD58;margin:12px 0 6px;font-size:16px">$1</h3>')
      .replace(/^- (.+)$/gm,'<li style="color:#ccc;margin:4px 0;font-size:13px">$1</li>')
      .replace(/\n/g,'<br>');
  }

  // Build the brief HTML
  function buildBrief(b){
    var icons={news:'\uD83D\uDCF0',financial:'\uD83D\uDCC8',leadership:'\uD83D\uDC64',hiring:'\uD83D\uDCBC',strategic:'\uD83C\uDFAF',social:'\uD83D\uDCF1',competitive:'\u2694\uFE0F'};
    var h='<div id="dailyBriefSection" style="margin-bottom:24px">';
    h+='<h2 style="color:#3DCD58;margin:0 0 4px">\uD83D\uDD0D Daily Intelligence Brief</h2>';
    h+='<p style="color:#888;font-size:12px;margin:0 0 16px">Updated: '+new Date(b.generated_at).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+'</p>';
    if(b.sections){
      b.sections.forEach(function(s){
        var ico=icons[s.id]||icons[s.icon]||'\uD83D\uDD35';
        var secId='brief_'+s.id;
        h+='<div style="background:#1a1a2e;border-radius:8px;padding:16px;margin-bottom:12px;border-left:3px solid #3DCD58">';
        h+='<h3 style="color:#3DCD58;margin:0 0 8px;font-size:15px;cursor:pointer" onclick="var c=document.getElementById(\''+secId+'\');c.style.display=c.style.display===\'none\'?\'block\':\'none\'">'+ico+' '+s.label+' <span style="font-size:11px;color:#888">\u25BC</span></h3>';
        h+='<div id="'+secId+'" style="display:block">';
        if(s.content){h+='<div style="color:#ccc;font-size:13px;line-height:1.6">'+md(s.content)+'</div>';}
        if(s.citations&&s.citations.length>0){
          h+='<div style="margin-top:8px;padding-top:8px;border-top:1px solid #333">';
          h+='<p style="color:#666;font-size:11px;margin:0 0 4px">Sources:</p>';
          s.citations.forEach(function(c,i){
            var domain=c.replace(/https?:\/\//,'').split('/')[0];
            h+='<a href="'+c+'" target="_blank" style="color:#3DCD58;font-size:11px;margin-right:8px">['+( i+1)+'] '+domain+'</a>';
          });
          h+='</div>';
        }
        h+='</div></div>';
      });
    }
    h+='</div><hr style="border-color:#333;margin:24px 0"><h2 style="color:#3DCD58">Baseline Intelligence</h2>';
    return h;
  }

  // Try to inject brief into the AI Updates page
  function tryInject(){
    if(!briefLoaded||!briefData)return;
    var mn=document.getElementById('mn');
    if(!mn)return;
    // Check if AI Updates page is active by looking for known content
    var content=mn.innerHTML;
    if(content.indexOf('AI-Powered Intelligence')!==-1||content.indexOf('Account Intelligence')!==-1||content.indexOf('Key Intelligence')!==-1){
      if(document.getElementById('dailyBriefSection'))return; // already injected
      mn.innerHTML=buildBrief(briefData)+content;
    }
  }

  // Watch for page changes using MutationObserver
  var observer=new MutationObserver(function(){
    setTimeout(tryInject,100);
  });
  var mn=document.getElementById('mn');
  if(mn){
    observer.observe(mn,{childList:true,subtree:true});
  }

  // Also try periodically in case observer misses
  setInterval(tryInject,1000);
})();
