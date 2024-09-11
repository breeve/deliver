DESCRIBE := $(shell git describe --tags)
DATE := $(shell date +"%Y%m%d%H%M%S")
TAG := $(DESCRIBE)-$(DATE)

image_tools:
	cd tools/pb/image; docker build . -f dockerfile -t toolspb:latest

pb:
	echo $(PATH)
	protoc \
	-I ./pkg/pb \
	-I ./pkg/pb/third_party \
	--go_out=. --go_opt=module=github.com/breeve/deliver \
	--go-grpc_out=. --go-grpc_opt=module=github.com/breeve/deliver \
	--grpc-gateway_out=. --grpc-gateway_opt=module=github.com/breeve/deliver \
	--validate_out=. --validate_opt=module=github.com/breeve/deliver --validate_opt=lang=go \
	$(shell find ./pkg/pb -iname "*.proto" -not -path "./pkg/pb/third_party*")

docker_pb:
	docker run --rm -v `pwd`:/src toolspb:latest sh -c "cd /src && make pb"
