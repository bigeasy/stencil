all: README.md

README.md: edify.md
	edify --mode text $< > $@
