# -*- coding: utf-8 -*-
"""
Created on Sat Aug 10 15:10:17 2013

@author: kthorn
"""

import urllib2
import csv
import json
import argparse

def getBibFromDOI(DOI):
    """Query dx.doi.org and return bibliographic information
    Returns a dictionary with the follow keys:
        firstAuthor
        soloAuthor - true if only one author
        journal
        title
        volume
        number
        year
        pages
        url
        doi
    """
    bibinfo = {'firstAuthor' : '', 'soloAuthor' : True, 'journal' : '',
               'title' : '', 'volume' : '', 'number' : '', 'year' : '',
               'pages' : '', 'url' : '', 'doi' : ''}
               
    request = urllib2.Request('http://dx.doi.org/' + DOI, 
                    headers={'Accept' : 'application/citeproc+json'})
    try:
        result = urllib2.urlopen(request)
    except urllib2.HTTPError:
        print('Could not resolve DOI ' + DOI)
        #If a DOI doesn't return data
        #keep the DOI and put that in the bibliography
        bibinfo['doi'] = DOI
        bibinfo['url'] = 'http://dx.doi.org/' + DOI
        return bibinfo
    
    #some DOIs are missing metadata, so we have to check for a lot of things
    rawbib = json.load(result)
    if 'container-title' in rawbib:
        bibinfo['journal'] = rawbib['container-title']
    if 'title' in rawbib:
        bibinfo['title'] = rawbib['title']
    if 'volume' in rawbib:
        bibinfo['volume'] = rawbib['volume']
    if 'issue' in rawbib:
        bibinfo['number'] = rawbib['issue']
    bibinfo['year'] = rawbib['issued']['date-parts'][0][0]
    if 'page' in rawbib:
        bibinfo['pages'] = rawbib['page']
    bibinfo['url'] = rawbib['URL']
    bibinfo['doi'] = rawbib['DOI']    
    
    if len(rawbib['author']) > 1:
        bibinfo['soloAuthor'] = False
    bibinfo['firstAuthor'] = rawbib['author'][0]['family']    
    return bibinfo
    
def formatBibliography(bibinfo):
    """Takes a bibinfo dictionary and returns a formatted HTML string
    """
    citation = "";

    if not bibinfo['firstAuthor'] =="":
        if bibinfo['soloAuthor']:
            citation = bibinfo['firstAuthor']
        else:
            citation = bibinfo['firstAuthor'] + r" <i>et al.</i>"
	
	if not bibinfo['title'] == "" and not bibinfo['title'] == None:
		citation += " " + bibinfo['title'] + "."
		   
    if not bibinfo['journal'] == "":
        citation +=" <i>" + bibinfo['journal'] +"</i>"
		
	if not bibinfo['year'] == "":
		citation +=" " +str(bibinfo['year']) + "."
        
    if not bibinfo['volume'] == "":
        citation += " <b>" + bibinfo['volume'] + "</b>"
        if not bibinfo['number'] == "":
            citation += "(" + bibinfo['number'] +")"
    
    if not bibinfo['pages'] == "":
        citation += ": " + bibinfo['pages'] + ". "
            
    citation += "doi: <a target=\"_blank\" href=\"" + bibinfo['url'] +"\">" + bibinfo['doi'] + "</a>"
    return citation
    

#Main code here
#input file
parser = argparse.ArgumentParser()
parser.add_argument("infile", help="Input CSV file to generate references for")
args = parser.parse_args()
csvFileIn = args.infile
basename = args.infile.split('.csv')
csvFileOut = basename[0] + '_processed.csv'
bibFileOut = basename[0] + '_bibliography.html'
DOIindex = dict() #here is where we store the mapping of DOI the order of appearance
maxRefNum = 1;
with open(csvFileIn, 'rU') as csvIn:
    FPreader = csv.DictReader(csvIn)
    with open(csvFileOut, 'wb') as csvOut:
        outHeaders = FPreader.fieldnames
        outHeaders.append('RefNum')
        csvwrite = csv.DictWriter(csvOut, outHeaders)
        csvwrite.writeheader()
        for datarow in FPreader:
            if not datarow['DOI'] in DOIindex:
                if not datarow['DOI'] == "": #some entries don't have DOIs
                    DOIindex[datarow['DOI']] = maxRefNum
                    maxRefNum += 1
            if not datarow['DOI'] == "": 
                datarow['RefNum'] = DOIindex[datarow['DOI']]
            else: 
                datarow['RefNum'] = ""
            csvwrite.writerow(datarow)

#Now generate bibliography from DOIindex
indexDOI = dict()
for key, val in DOIindex.items():
    if val in indexDOI:
        raise NameError('Duplicate indices!')
    else:
        indexDOI[val] = key

with open(bibFileOut, 'wb') as htmlOut:
    htmlOut.write("<ol>")
    for k in sorted(indexDOI.keys()):
        print("Processing DOI " + str(k))
        bib = getBibFromDOI(indexDOI[k])
        if bib:
            bibstring = formatBibliography(bib)
            outstring = "<li id=\"ref" + str(k) + "\">" + bibstring +"</li>\r\n"
            #deal with unicode characters
            outstring = outstring.encode('ascii', 'xmlcharrefreplace')
            htmlOut.write(outstring)
    htmlOut.write("</ol>")

